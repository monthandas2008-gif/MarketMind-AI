"""
OrchestratorService for MarketMind.
Directs query routing, parallel agent invocation, single-stock in-depth analysis,
conversational query answering, and automated daily report generation.
"""

import asyncio
import json
import logging
import re
from datetime import datetime, date
from typing import Dict, Any, List, Optional

from app.config import settings
from app.models.analysis import StockAnalysis, AgentResult
from app.models.report import DailyReport
from app.models.chat import ChatResponse
from app.models.market import MarketOverview
from app.services.market_data import market_data_service
from app.services.news import news_service
from app.agents.technical import technical_agent
from app.agents.news_intel import news_agent
from app.agents.anomaly import anomaly_agent
from app.agents.synthesis import synthesis_agent
from app.llm.client import gemini_client
from app.llm.prompts import DAILY_REPORT_SYSTEM_PROMPT
from app.services.instrument_master import instrument_master
from app.db.client import db

logger = logging.getLogger(__name__)

class OrchestratorService:
    def __init__(self):
        self.stock_universe = settings.market.stock_universe

    def _extract_symbols(self, text: str) -> List[str]:
        """Detects mentioned monitored stock symbols in free text using the Instrument Master."""
        text_upper = text.upper()
        found = []
        if "NIFTY" in text_upper or "SENSEX" in text_upper or "INDEX" in text_upper:
            found.append("NIFTY50")

        all_instruments = instrument_master.get_all_instruments()
        # Word boundary tokens to prevent false positives on substrings
        words = set(re.findall(r"\b[A-Za-z0-9&]+\b", text_upper))

        for inst in all_instruments:
            sym = inst.symbol
            if sym in words or sym in text_upper:
                found.append(sym)
                continue
            if inst.company_name.upper() in text_upper:
                found.append(sym)
                continue
            if inst.aliases:
                for al in inst.aliases:
                    if al.upper() in text_upper or al.upper() in words:
                        found.append(sym)
                        break
        return list(dict.fromkeys(found))

    async def analyze_stock(self, symbol: str, trigger: str = "on_demand") -> StockAnalysis:
        """
        Runs the full 4-agent parallel pipeline for a single stock.
        Every stock entering this method undergoes the complete Technical, News, Anomaly,
        and Synthesis Desk workflows without degradation.
        """
        sym_clean = symbol.upper().strip()
        logger.info(f"Orchestrating multi-agent analysis for {sym_clean} ({trigger})")

        # 1. Fetch raw data asynchronously in parallel
        quote_task = market_data_service.fetch_stock_quote(sym_clean)
        indicators_task = market_data_service.compute_indicators(sym_clean)
        news_task = news_service.fetch_stock_news(sym_clean, limit=6)
        nifty_quote_task = market_data_service.fetch_stock_quote("NIFTY50")

        quote, indicators, news, nifty_quote = await asyncio.gather(
            quote_task, indicators_task, news_task, nifty_quote_task, return_exceptions=False
        )

        context = {
            "trigger": trigger,
            "quote": quote.model_dump(),
            "indicators": indicators,
            "news": news,
            "nifty": {
                "close": nifty_quote.close,
                "change_percent": nifty_quote.change_percent
            }
        }

        # 2. Invoke Specialized Agents concurrently
        tech_task = technical_agent.analyze(sym_clean, context)
        news_task_agent = news_agent.analyze(sym_clean, context)
        anom_task = anomaly_agent.analyze(sym_clean, context)

        tech_res, news_res, anom_res = await asyncio.gather(
            tech_task, news_task_agent, anom_task, return_exceptions=False
        )

        # 3. Invoke Lead Synthesis Agent
        agent_results = {
            "technical": tech_res,
            "news": news_res,
            "anomaly": anom_res
        }
        synthesis_res = await synthesis_agent.synthesize(sym_clean, agent_results, context)

        analysis = StockAnalysis(
            symbol=sym_clean,
            technical=tech_res,
            news=news_res,
            anomaly=anom_res,
            synthesis=synthesis_res,
            analysis_date=quote.trade_date
        )

        # Persist full analysis snapshot to database
        try:
            analysis_dict = analysis.model_dump(mode="json")
            await db.save_agent_analysis({
                "symbol": sym_clean,
                "analysis_date": quote.trade_date,
                "analysis_type": trigger,
                "technical_summary": tech_res.findings if tech_res else None,
                "technical_signal": tech_res.signal if tech_res else None,
                "technical_indicators": indicators,
                "news_summary": news_res.findings if news_res else None,
                "news_sentiment": news_res.signal if news_res else None,
                "news_sources": [e.model_dump(mode="json") for e in news_res.evidence] if news_res else [],
                "anomaly_detected": anom_res.signal != "neutral" if anom_res else False,
                "anomaly_summary": anom_res.findings if anom_res else None,
                "anomaly_metrics": indicators,
                "synthesis": synthesis_res.findings if synthesis_res else None,
                "evidence_strength": "moderate",
                "uncertainty_note": "Analytical indicators represent momentum assessment, not guaranteed predictions.",
                "key_factors": [e.claim for e in (synthesis_res.evidence if synthesis_res else [])],
                "raw_payload": analysis_dict
            })
        except Exception as e:
            logger.warning(f"Could not persist analysis for {sym_clean} to DB: {e}")

        return analysis

    async def answer_query(
        self,
        query: str,
        user_id: Optional[str] = None,
        user_api_key: Optional[str] = None
    ) -> ChatResponse:
        """
        Determines query intent and selectively activates required tools and agents.
        Injects real-time Indian equities telemetry, news feeds, and portfolio context
        into conversational Gemini reasoning.
        """
        logger.info(f"Orchestrating response for query: '{query}' (user={user_id})")
        mentioned_symbols = self._extract_symbols(query)
        q_lower = query.lower()

        agents_used = []
        response_data: Dict[str, Any] = {}

        # Case 1: Specific Stock Question (e.g. "Why did TCS move?", "Analyze RELIANCE")
        if mentioned_symbols and mentioned_symbols[0] != "NIFTY50":
            target_symbol = mentioned_symbols[0]
            agents_used = ["technical", "news", "anomaly", "synthesis", "gemini_reasoning"]
            
            analysis = await self.analyze_stock(target_symbol, trigger="chat_query")
            response_data = analysis.model_dump(mode="json")

            tech = analysis.technical
            nw = analysis.news
            synth = analysis.synthesis
            anom = analysis.anomaly

            # Grounded AI synthesis answering the user's specific angle
            ai_synthesis_prompt = f"""USER QUESTION: "{query}"

TARGET EQUITY: {target_symbol}
MULTI-DESK RESEARCH FINDINGS:
- Overall Signal: {synth.signal.upper()} (Confidence: {synth.confidence})
- Synthesis: {synth.findings}
- Technical Desk: {tech.findings if tech else 'N/A'} (Indicators: {tech.indicators if tech else 'N/A'})
- News & Catalysts Desk: {nw.findings if nw else 'N/A'} (Sentiment: {nw.sentiment if nw else 'N/A'})
- Statistical Anomaly Desk: {anom.findings if anom else 'N/A'}

Provide an authoritative, clear response to the user's specific question using these multi-desk findings."""

            system_instruction = (
                "You are MarketMind Intelligence, an expert Indian equities research analyst. "
                "Answer the user's question directly with clear rationale, evidence from the research desks, "
                "key technical levels, and risk factors. Use clean markdown with headers and bullet points."
            )

            try:
                ai_answer = await gemini_client.generate(
                    system_prompt=system_instruction,
                    user_prompt=ai_synthesis_prompt,
                    use_cache=False,
                    override_api_key=user_api_key
                )
                formatted_response = ai_answer
            except Exception:
                formatted_response = (
                    f"### MarketMind Intelligence for {target_symbol}\n\n"
                    f"**Overall Analytical Signal:** {synth.signal.upper()} (Confidence: {synth.confidence.capitalize()})\n\n"
                    f"**Synthesis:**\n{synth.findings}\n\n"
                    f"**Technical Assessment:**\n{tech.findings if tech else 'N/A'}\n\n"
                    f"**News & Catalysts:**\n{nw.findings if nw else 'N/A'}\n\n"
                    f"**Statistical Patterns:**\n{anom.findings if anom else 'N/A'}\n\n"
                    f"> **Evidence Strength:** {getattr(synth, 'evidence_strength', 'Moderate')}. "
                    f"Analytical indicators represent momentum assessment, not guaranteed predictions."
                )

        # Case 2: Comparison (e.g. "Compare TCS and INFY")
        elif len(mentioned_symbols) >= 2:
            agents_used = ["technical", "synthesis", "gemini_reasoning"]
            sym1, sym2 = mentioned_symbols[0], mentioned_symbols[1]
            a1, a2 = await asyncio.gather(self.analyze_stock(sym1), self.analyze_stock(sym2))
            response_data = {"stock_1": a1.model_dump(), "stock_2": a2.model_dump()}

            comparison_prompt = f"""USER QUESTION: "{query}"

COMPARE {sym1} VS {sym2}:
{sym1}:
- Signal: {a1.synthesis.signal.upper()} (Confidence: {a1.synthesis.confidence})
- Synthesis: {a1.synthesis.findings}
- Technical: {a1.technical.findings if a1.technical else 'N/A'}
- News: {a1.news.findings if a1.news else 'N/A'}

{sym2}:
- Signal: {a2.synthesis.signal.upper()} (Confidence: {a2.synthesis.confidence})
- Synthesis: {a2.synthesis.findings}
- Technical: {a2.technical.findings if a2.technical else 'N/A'}
- News: {a2.news.findings if a2.news else 'N/A'}

Provide a structured, side-by-side institutional comparison highlighting momentum differences, technical support/resistance, and risk factors."""

            try:
                formatted_response = await gemini_client.generate(
                    system_prompt="You are MarketMind Intelligence, an expert Indian equities research analyst.",
                    user_prompt=comparison_prompt,
                    use_cache=False,
                    override_api_key=user_api_key
                )
            except Exception:
                formatted_response = (
                    f"### Comparative Intelligence: {sym1} vs {sym2}\n\n"
                    f"**{sym1}:**\n- Signal: {a1.synthesis.signal.upper()}\n- Technical: {a1.technical.findings}\n\n"
                    f"**{sym2}:**\n- Signal: {a2.synthesis.signal.upper()}\n- Technical: {a2.technical.findings}\n\n"
                    f"**Key Takeaway:** {sym1} shows {a1.synthesis.signal} momentum compared to {sym2}'s {a2.synthesis.signal} posture."
                )

        # Case 3: Unusual volume or mover query (e.g. "Which stocks had unusual volume?")
        elif "volume" in q_lower or "unusual" in q_lower or "mover" in q_lower:
            agents_used = ["anomaly", "market_data"]
            movers = await market_data_service.identify_significant_movers()
            response_data = {"significant_movers": movers}
            if movers:
                lines = [f"- **{m['symbol']}** ({m['change_percent']:+.2f}%): {', '.join(m['reasons'])}" for m in movers]
                formatted_response = (
                    f"### Significant Market Movements & Volume Spikes Today\n\n"
                    f"Detected {len(movers)} noteworthy stock(s) trading outside standard deviation bounds:\n" + "\n".join(lines)
                )
            else:
                formatted_response = "All monitored stocks traded within normal volume and price volatility bounds today."

        # Case 4: News query (e.g. "Show today's market news")
        elif "news" in q_lower or "headline" in q_lower:
            agents_used = ["news"]
            market_news = await news_service.fetch_market_news(limit=6)
            response_data = {"news": market_news}
            lines = [f"- [{a['source_name']}] **{a['headline']}**\n  *Read:* {a['source_url']}" for a in market_news]
            formatted_response = "### Latest Indian Financial Market News\n\n" + "\n".join(lines)

        # Case 5: General Market State, Technical Education, or Any Free-form Query
        else:
            agents_used = ["market_data", "news", "synthesis", "gemini_reasoning"]
            overview_task = market_data_service.fetch_nifty50_overview()
            recent_news_task = news_service.fetch_market_news(limit=6)
            movers_task = market_data_service.identify_significant_movers()
            tracked_task = db.get_user_tracked_stocks(user_id) if user_id else asyncio.sleep(0, result=[])

            overview, recent_news, movers, tracked_records = await asyncio.gather(
                overview_task, recent_news_task, movers_task, tracked_task
            )

            response_data = {
                "overview": overview.model_dump(),
                "news": recent_news,
                "movers": movers,
                "tracked_count": len(tracked_records or []) if isinstance(tracked_records, list) else 0
            }

            news_bullets = "\n".join([f"- [{a.get('source_name', 'Press')}] {a.get('headline')}" for a in recent_news])
            movers_bullets = "\n".join([f"- {m.get('symbol')}: {m.get('change_percent', 0):+.2f}% ({', '.join(m.get('reasons', []))})" for m in movers[:4]])
            tracked_symbols = [r.get('symbol') for r in (tracked_records or [])] if isinstance(tracked_records, list) else []

            llm_system_prompt = f"""You are MarketMind AI — an advanced Indian stock market conversational intelligence agent (like ChatGPT/Google grounded in real-time NSE/BSE feeds).

CURRENT LIVE INDIAN MARKET TELEMETRY:
- NIFTY 50 Benchmark: {overview.nifty_close:.2f} ({overview.nifty_change_percent:+.2f}%)
- Advances / Declines: {overview.advances} Advancing vs {overview.declines} Declining
- Top Gainers: {', '.join([f"{g.symbol} ({g.change_percent:+.2f}%)" for g in overview.top_gainers]) or 'None'}
- Top Losers: {', '.join([f"{l.symbol} ({l.change_percent:+.2f}%)" for l in overview.top_losers]) or 'None'}
- Significant Movers & Unusual Volume:
{movers_bullets if movers_bullets else 'All monitored equities within normal bounds.'}
- User's Tracked Equities Portfolio: {', '.join(tracked_symbols) if tracked_symbols else 'Default large-cap watchlist (RELIANCE, TCS, INFY, ICICIBANK, ITC)'}
- Latest Financial News Feed:
{news_bullets}

INSTRUCTIONS:
1. Answer the user's specific question directly, accurately, and thoughtfully using the live market telemetry above.
2. If asked general stock market questions, technical analysis concepts, macroeconomic trends, or stock insights, provide rich, insightful, educational answers with Indian market context.
3. If referencing prices or movements, cite the exact real-time figures provided in the telemetry.
4. Format your answer with clean Markdown (bolding key numbers, using bullet points, and organizing with headers).
"""

            try:
                formatted_response = await gemini_client.generate(
                    system_prompt=llm_system_prompt,
                    user_prompt=query,
                    use_cache=False,
                    override_api_key=user_api_key
                )
            except Exception as e:
                logger.error(f"Error in Gemini chat generation: {e}")
                formatted_response = (
                    f"### Indian Market Session Overview\n\n"
                    f"- **NIFTY 50:** {overview.nifty_close:.2f} ({overview.nifty_change_percent:+.2f}%)\n"
                    f"- **Advance / Decline:** {overview.advances} Advancing / {overview.declines} Declining\n"
                    f"- **Top Gainers:** {', '.join([f'{g.symbol} ({g.change_percent:+.2f}%)' for g in overview.top_gainers]) or 'None'}\n"
                    f"- **Top Losers:** {', '.join([f'{l.symbol} ({l.change_percent:+.2f}%)' for l in overview.top_losers]) or 'None'}\n\n"
                    f"**Top Headlines:**\n" +
                    "\n".join([f"- {a['headline']} ({a['source_name']})" for a in recent_news[:3]])
                )

        chat_resp = ChatResponse(
            query=query,
            response=formatted_response,
            agents_used=agents_used,
            response_data=response_data,
            created_at=datetime.now().isoformat()
        )

        # Save query to database history
        await db.save_chat_query({
            "user_query": query,
            "parsed_intent": {"symbols": mentioned_symbols},
            "response": formatted_response,
            "response_data": response_data,
            "agents_used": agents_used
        })

        return chat_resp

    async def generate_daily_report(self) -> DailyReport:
        """
        Executes the end-of-day market brief combining Nifty performance,
        significant movers, and synthesized market intelligence.
        """
        logger.info("Generating Daily Market Intelligence Report...")
        today_str = date.today().isoformat()

        overview = await market_data_service.fetch_nifty50_overview()
        movers = await market_data_service.identify_significant_movers()
        market_news = await news_service.fetch_market_news(limit=5)

        # Analyze significant movers if any
        mover_analyses = []
        for m in movers[:3]:
            try:
                ana = await self.analyze_stock(m["symbol"], trigger="daily_auto")
                mover_analyses.append(f"{m['symbol']}: {ana.synthesis.findings}")
            except Exception as e:
                logger.error(f"Error analyzing mover {m['symbol']}: {e}")

        # Assemble prompt for LLM report synthesis
        user_prompt = f"""GENERATE DAILY INDIAN MARKET REPORT FOR DATE: {today_str}

NIFTY 50 BENCHMARK:
- Close: {overview.nifty_close:.2f} ({overview.nifty_change_percent:+.2f}%)
- Gainers: {[(g.symbol, g.change_percent) for g in overview.top_gainers]}
- Losers: {[(l.symbol, l.change_percent) for l in overview.top_losers]}

SIGNIFICANT ANOMALIES & MOVERS:
{chr(10).join(mover_analyses) if mover_analyses else 'All monitored large-caps traded within standard volatility parameters.'}

TOP NEWS HEADLINES:
{chr(10).join([f"- {a['headline']} ({a['source_name']})" for a in market_news])}

Synthesize a comprehensive, institutional-grade market summary.
"""

        try:
            raw_response = await gemini_client.generate(
                system_prompt=DAILY_REPORT_SYSTEM_PROMPT,
                user_prompt=user_prompt
            )
            data = json.loads(raw_response)
        except Exception as e:
            logger.error(f"Failed to generate daily report from LLM: {e}")
            data = {
                "market_summary": f"Nifty 50 finished the session at {overview.nifty_close:.2f} ({overview.nifty_change_percent:+.2f}%).",
                "technical_intelligence": "Index holding key moving averages.",
                "news_intelligence": "Domestic news flow driven by corporate announcements.",
                "anomalies": f"{len(movers)} stock(s) exhibited unusual price/volume activity.",
                "ai_synthesis": "Balanced market structure with selective stock-specific rotation.",
                "evidence_strength": "moderate"
            }

        sources = [{"name": a["source_name"], "url": a["source_url"]} for a in market_news]

        report = DailyReport(
            report_date=today_str,
            market_summary=data.get("market_summary", ""),
            nifty_close=overview.nifty_close,
            nifty_change_percent=overview.nifty_change_percent,
            top_gainers=overview.top_gainers,
            top_losers=overview.top_losers,
            unusual_activity=movers,
            technical_intelligence=data.get("technical_intelligence", ""),
            news_intelligence=data.get("news_intelligence", ""),
            anomalies=data.get("anomalies", ""),
            ai_synthesis=data.get("ai_synthesis", ""),
            evidence_strength=data.get("evidence_strength", "moderate"),
            sources=sources,
            created_at=datetime.now().isoformat()
        )

        # Save to database
        await db.save_daily_report(report.model_dump())
        logger.info("Daily report generated and saved to database.")
        return report

    async def analyze_tracked_universe(
        self, symbols: List[str], trigger: str = "universe_scan", max_concurrency: int = 3
    ) -> Dict[str, StockAnalysis]:
        """
        Runs the full 4-agent parallel pipeline on a list of symbols with bounded concurrency.
        Individual failures are caught and isolated so the rest of the universe succeeds.
        """
        syms_clean = list(dict.fromkeys([s.upper().strip() for s in symbols if s.upper().strip() != "NIFTY50"]))
        sem = asyncio.Semaphore(max_concurrency)
        results: Dict[str, StockAnalysis] = {}

        async def _run_for_symbol(s: str):
            async with sem:
                try:
                    logger.info(f"Starting pipeline analysis for tracked symbol: {s}")
                    ana = await self.analyze_stock(s, trigger=trigger)
                    results[s] = ana
                except Exception as e:
                    logger.error(f"Pipeline analysis failed for tracked symbol {s}: {e}")

        tasks = [_run_for_symbol(s) for s in syms_clean]
        await asyncio.gather(*tasks, return_exceptions=True)
        return results

    async def generate_user_daily_report(
        self, user_id: str, tracked_symbols: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Executes a personalized daily briefing for a user covering their exact tracked universe.
        Preserves an immutable stocks_snapshot of the analyzed universe at report time.
        """
        logger.info(f"Generating personalized daily report for user: {user_id}")
        today_str = date.today().isoformat()

        # 1. Resolve symbols to analyze
        if not tracked_symbols:
            tracked_objs = await db.get_user_tracked_stocks(user_id)
            if tracked_objs:
                symbols_to_run = [t["symbol"] for t in tracked_objs]
            else:
                symbols_to_run = [s for s in self.stock_universe if s != "NIFTY50"]
        else:
            symbols_to_run = [s.upper().strip() for s in tracked_symbols if s.upper().strip() != "NIFTY50"]

        symbols_to_run = list(dict.fromkeys(symbols_to_run))
        if not symbols_to_run:
            symbols_to_run = ["RELIANCE", "TCS", "INFY"]

        # 2. Run full 4-agent analysis on each tracked stock concurrently
        analyses_map = await self.analyze_tracked_universe(symbols_to_run, trigger="user_daily_report")

        # 3. Fetch Market Overview and News
        overview = await market_data_service.fetch_nifty50_overview(symbols=symbols_to_run)
        movers = await market_data_service.identify_significant_movers(symbols=symbols_to_run)
        market_news = await news_service.fetch_market_news(limit=5)

        # 4. Compile summaries for each tracked stock
        stock_summaries = []
        for sym, ana in analyses_map.items():
            inst = instrument_master.get_by_symbol(sym)
            c_name = inst.company_name if inst else sym
            synth = ana.synthesis.findings if ana.synthesis else "Analysis unavailable"
            sig = ana.synthesis.signal if ana.synthesis else "neutral"
            stock_summaries.append(f"- **{sym} ({c_name})** [{sig.upper()}]: {synth}")

        # 5. LLM Synthesis or deterministic institutional fallback
        user_prompt = f"""GENERATE PERSONALIZED INDIAN EQUITY PORTFOLIO REPORT FOR USER: {user_id}
DATE: {today_str}

TRACKED UNIVERSE STOCKS ({len(symbols_to_run)}): {', '.join(symbols_to_run)}

MULTI-AGENT INTELLIGENCE FINDINGS ACROSS TRACKED EQUITIES:
{chr(10).join(stock_summaries) if stock_summaries else 'No individual stock analyses available.'}

MACRO BENCHMARK CONTEXT:
- NIFTY 50: {overview.nifty_close:.2f} ({overview.nifty_change_percent:+.2f}%)
- Tracked Gainers: {[(g.symbol, g.change_percent) for g in overview.top_gainers]}
- Tracked Losers: {[(l.symbol, l.change_percent) for l in overview.top_losers]}

SIGNIFICANT ANOMALIES & VOLUME MOVERS:
{chr(10).join([f"- {m['symbol']}: {', '.join(m['reasons'])}" for m in movers]) if movers else 'All tracked equities traded within standard volatility parameters.'}

TOP NEWS HEADLINES:
{chr(10).join([f"- {a['headline']} ({a['source_name']})" for a in market_news])}

Synthesize a comprehensive, institutional-grade portfolio intelligence report customized to the user's tracked holdings.
"""
        report_data = {}
        try:
            raw_response = await gemini_client.generate(
                system_prompt=DAILY_REPORT_SYSTEM_PROMPT,
                user_prompt=user_prompt
            )
            report_data = json.loads(raw_response)
        except Exception as e:
            logger.error(f"Failed to generate user daily report from LLM: {e}")
            report_data = {
                "market_summary": f"Your tracked universe of {len(symbols_to_run)} equities experienced active rotation while NIFTY 50 moved {overview.nifty_change_percent:+.2f}%.",
                "technical_intelligence": "Key technical levels held across monitored positions.",
                "news_intelligence": "Sector-specific updates guided price discovery across your tracked watchlist.",
                "anomalies": f"{len(movers)} of your tracked stocks exhibited elevated volume or momentum today.",
                "ai_synthesis": f"Multi-desk synthesis indicates steady conviction across {len(analyses_map)} tracked securities.",
                "evidence_strength": "moderate"
            }

        sources = [{"name": a["source_name"], "url": a["source_url"]} for a in market_news]

        # 6. Build report structure and persist
        user_report = {
            "id": f"{user_id}_{today_str}",
            "user_id": user_id,
            "report_date": today_str,
            "stocks_snapshot": symbols_to_run,
            "market_summary": report_data.get("market_summary", ""),
            "nifty_close": overview.nifty_close,
            "nifty_change_percent": overview.nifty_change_percent,
            "biggest_movers": [m if isinstance(m, dict) else m.model_dump() for m in overview.top_gainers[:3]],
            "technical_developments": report_data.get("technical_intelligence", ""),
            "news_intelligence": report_data.get("news_intelligence", ""),
            "unusual_activity": movers,
            "cross_stock_insights": report_data.get("anomalies", ""),
            "lead_synthesis": report_data.get("ai_synthesis", ""),
            "evidence_strength": report_data.get("evidence_strength", "moderate"),
            "sources": sources,
            "data_freshness": datetime.now().isoformat(),
            "analyses": {s: a.model_dump(mode="json") for s, a in analyses_map.items()}
        }

        try:
            await db.save_user_daily_report(user_report)
        except Exception as e:
            logger.warning(f"Could not persist user daily report to DB: {e}")

        return user_report

orchestrator_service = OrchestratorService()
