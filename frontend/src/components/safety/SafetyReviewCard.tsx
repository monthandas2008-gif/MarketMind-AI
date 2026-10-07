'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, TrendingUp, Target, Brain, 
  Newspaper, Activity, ChevronDown, ChevronUp, Info 
} from 'lucide-react';
import type { 
  TradeSafetyReviewResponse, 
  SafetyRecommendation,
  MarketRiskAgentOutput,
  PortfolioRiskAgentOutput,
  TradePlanAgentOutput,
  NewsEvidenceAgentOutput,
  BehaviourAgentOutput
} from '@/lib/safety';

interface SafetyReviewCardProps {
  review: TradeSafetyReviewResponse;
}

const getVerdictConfig = (recommendation: SafetyRecommendation) => {
  switch (recommendation) {
    case 'SAFE_TO_REVIEW':
      return { label: 'SAFE TO REVIEW', color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-500/30', icon: ShieldCheck };
    case 'PROCEED_WITH_CAUTION':
      return { label: 'PROCEED WITH CAUTION', color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-500/30', icon: AlertTriangle };
    case 'PAUSE_AND_REVIEW':
      return { label: 'PAUSE AND REVIEW', color: 'text-orange-400', bg: 'bg-orange-950/60', border: 'border-orange-500/30', icon: AlertTriangle };
    case 'DO_NOT_PROCEED':
      return { label: 'DO NOT PROCEED', color: 'text-red-400', bg: 'bg-red-950/60', border: 'border-red-500/30', icon: AlertTriangle };
    default:
      return { label: 'UNKNOWN', color: 'text-[#94a3b8]', bg: 'bg-[#171c28]', border: 'border-[#222938]', icon: Info };
  }
};

const getAgentStatusColor = (status: string, agentType: string, recommendation?: string) => {
    if (status === 'FAILED' || status === 'UNAVAILABLE') return 'bg-red-500';
    // Simplified status coloring based on agent output properties
    if (agentType === 'MarketRiskAgent' && recommendation === 'HIGH') return 'bg-red-500';
    if (agentType === 'MarketRiskAgent' && recommendation === 'MODERATE') return 'bg-amber-500';
    
    if (agentType === 'PortfolioRiskAgent' && recommendation === 'LIMIT_REACHED') return 'bg-red-500';
    if (agentType === 'PortfolioRiskAgent' && recommendation === 'CAUTION') return 'bg-amber-500';

    if (agentType === 'TradePlanAgent' && (recommendation === 'WEAK' || recommendation === 'INCOMPLETE')) return 'bg-red-500';
    
    if (agentType === 'NewsEvidenceAgent' && recommendation === 'NEGATIVE') return 'bg-red-500';
    if (agentType === 'NewsEvidenceAgent' && recommendation === 'MIXED') return 'bg-amber-500';

    if (agentType === 'BehaviourAgent' && recommendation === 'PAUSE_RECOMMENDED') return 'bg-red-500';
    if (agentType === 'BehaviourAgent' && recommendation === 'ATTENTION_NEEDED') return 'bg-amber-500';

    return 'bg-emerald-500';
};

const AccordionItem = ({ title, icon: Icon, children, defaultExpanded = false }: { title: string, icon: any, children: React.ReactNode, defaultExpanded?: boolean }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className="border border-[#334155] rounded-lg bg-[#1e293b] overflow-hidden mb-3">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full flex items-center justify-between p-4 hover:bg-[#334155]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-[#94a3b8]" />
          <span className="font-semibold text-white">{title}</span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-[#64748b]" /> : <ChevronDown className="w-5 h-5 text-[#64748b]" />}
      </button>
      {expanded && (
        <div className="p-4 pt-0 border-t border-[#334155] mt-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default function SafetyReviewCard({ review }: SafetyReviewCardProps) {
  const verdict = getVerdictConfig(review.safety_recommendation);
  const VerdictIcon = verdict.icon;

  const agents = [
    { name: 'Market', type: 'MarketRiskAgent', status: review.agents.market_risk.status, rec: review.agents.market_risk.market_risk },
    { name: 'Portfolio', type: 'PortfolioRiskAgent', status: review.agents.portfolio_risk.status, rec: review.agents.portfolio_risk.risk_status },
    { name: 'Plan', type: 'TradePlanAgent', status: review.agents.trade_plan.status, rec: review.agents.trade_plan.plan_quality },
    { name: 'News', type: 'NewsEvidenceAgent', status: review.agents.news_evidence.status, rec: review.agents.news_evidence.evidence_signal },
    { name: 'Coach', type: 'BehaviourAgent', status: review.agents.behaviour.status, rec: review.agents.behaviour.behaviour_status },
    { name: 'Reviewer', type: 'ReviewerAgent', status: review.agents.reviewer.status, rec: review.agents.reviewer.safety_recommendation }
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      
      {/* Top Verdict Section */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            Trade Safety Intelligence
            <span className="text-sm font-normal text-[#64748b] ml-2">Workflow: {review.workflow_id}</span>
          </h2>
          <div className="text-[#94a3b8] text-sm flex gap-4">
            <span>Ticker: <strong className="text-white">{review.ticker}</strong></span>
            <span>Session: <strong className="text-white">{review.market_session}</strong></span>
          </div>
        </div>
        <div className={`flex flex-col items-end`}>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-bold ${verdict.bg} ${verdict.border} ${verdict.color}`}>
            <VerdictIcon className="w-5 h-5" />
            {verdict.label}
          </div>
          <span className="text-xs text-[#64748b] mt-2">Overall Confidence: {(review.overall_confidence * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
        <div className="flex items-center justify-between">
          {agents.map((agent, i) => (
            <div key={i} className="flex flex-col items-center flex-1 relative">
              <div className={`w-3 h-3 rounded-full mb-2 z-10 border-2 border-[#1e293b] ${getAgentStatusColor(agent.status, agent.type, agent.rec)}`} />
              <span className="text-xs text-[#94a3b8] font-medium">{agent.name}</span>
              {i < agents.length - 1 && (
                <div className="absolute top-1.5 left-[50%] w-full h-[2px] bg-[#334155] -z-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Deterministic Calculations */}
      <AccordionItem title="Deterministic Risk Calculations" icon={Activity} defaultExpanded={true}>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-[#0f172a] p-3 rounded border border-[#334155]">
              <span className="text-[#64748b] block mb-1">Pos. Value</span>
              <span className="text-white font-mono">${review.deterministic_calculations.requested_quantity * review.deterministic_calculations.entry_price}</span>
            </div>
            <div className="bg-[#0f172a] p-3 rounded border border-[#334155]">
              <span className="text-[#64748b] block mb-1">Est. Charges</span>
              <span className="text-amber-400 font-mono">${review.deterministic_calculations.estimated_charges.toFixed(2)}</span>
            </div>
            <div className="bg-[#0f172a] p-3 rounded border border-[#334155]">
              <span className="text-[#64748b] block mb-1">Worst Case Loss</span>
              <span className="text-red-400 font-mono">${review.deterministic_calculations.estimated_worst_case_loss.toFixed(2)}</span>
            </div>
            <div className="bg-[#0f172a] p-3 rounded border border-[#334155]">
              <span className="text-[#64748b] block mb-1">Risk/Reward</span>
              <span className="text-emerald-400 font-mono">{review.deterministic_calculations.risk_reward_ratio ? `1:${review.deterministic_calculations.risk_reward_ratio.toFixed(2)}` : 'N/A'}</span>
            </div>
         </div>
      </AccordionItem>

      {/* Agent Accordions */}
      <div className="space-y-1">
        <AccordionItem title="Market Risk Analyst" icon={TrendingUp}>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2 items-center mb-2">
              <span className="text-[#94a3b8]">Risk Level:</span>
              <span className="font-mono text-white px-2 py-0.5 bg-[#0f172a] rounded">{review.agents.market_risk.market_risk}</span>
            </div>
            <div>
              <strong className="text-white block mb-1">Context:</strong>
              <div className="text-[#94a3b8] bg-[#0f172a] p-3 rounded border border-[#334155] grid grid-cols-2 gap-2">
                <span>Direction: {review.agents.market_risk.market_context.market_direction}</span>
                <span>Regime: {review.agents.market_risk.market_context.regime}</span>
                <span>Vol: {review.agents.market_risk.market_context.volatility}</span>
                <span>Breadth: {review.agents.market_risk.market_context.breadth}</span>
              </div>
            </div>
            {review.agents.market_risk.risk_flags.length > 0 && (
              <div>
                <strong className="text-red-400 block mb-1">Risk Flags:</strong>
                <ul className="list-disc pl-5 text-[#94a3b8]">
                  {review.agents.market_risk.risk_flags.map((flag, idx) => <li key={idx}>{flag}</li>)}
                </ul>
              </div>
            )}
            <div>
              <strong className="text-white block mb-1">Reasoning:</strong>
              <ul className="list-disc pl-5 text-[#94a3b8]">
                {review.agents.market_risk.reasoning.map((r, idx) => <li key={idx}>{r}</li>)}
              </ul>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem title="Portfolio Risk Analyst" icon={Target}>
           <div className="space-y-3 text-sm">
            <div className="flex gap-2 items-center mb-2">
              <span className="text-[#94a3b8]">Risk Status:</span>
              <span className="font-mono text-white px-2 py-0.5 bg-[#0f172a] rounded">{review.agents.portfolio_risk.risk_status}</span>
            </div>
            {review.agents.portfolio_risk.breaches.length > 0 && (
              <div>
                <strong className="text-red-400 block mb-1">Breaches:</strong>
                <ul className="list-disc pl-5 text-[#94a3b8]">
                  {review.agents.portfolio_risk.breaches.map((b, idx) => <li key={idx}>{b}</li>)}
                </ul>
              </div>
            )}
             <div>
              <strong className="text-white block mb-1">Reasoning:</strong>
              <ul className="list-disc pl-5 text-[#94a3b8]">
                {review.agents.portfolio_risk.reasoning.map((r, idx) => <li key={idx}>{r}</li>)}
              </ul>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem title="Trade Plan Analyst" icon={Brain}>
           <div className="space-y-3 text-sm">
            <div className="flex gap-2 items-center mb-2">
              <span className="text-[#94a3b8]">Plan Quality:</span>
              <span className="font-mono text-white px-2 py-0.5 bg-[#0f172a] rounded">{review.agents.trade_plan.plan_quality}</span>
            </div>
            {review.agents.trade_plan.missing_fields.length > 0 && (
              <div>
                <strong className="text-amber-400 block mb-1">Missing Fields:</strong>
                <ul className="list-disc pl-5 text-[#94a3b8]">
                  {review.agents.trade_plan.missing_fields.map((f, idx) => <li key={idx}>{f}</li>)}
                </ul>
              </div>
            )}
            {review.agents.trade_plan.logical_issues.length > 0 && (
              <div>
                <strong className="text-red-400 block mb-1">Logical Issues:</strong>
                <ul className="list-disc pl-5 text-[#94a3b8]">
                  {review.agents.trade_plan.logical_issues.map((i, idx) => <li key={idx}>{i}</li>)}
                </ul>
              </div>
            )}
             <div>
              <strong className="text-white block mb-1">Reasoning:</strong>
              <ul className="list-disc pl-5 text-[#94a3b8]">
                {review.agents.trade_plan.reasoning.map((r, idx) => <li key={idx}>{r}</li>)}
              </ul>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem title="News Evidence Analyst" icon={Newspaper}>
           <div className="space-y-3 text-sm">
            <div className="flex gap-2 items-center mb-2">
              <span className="text-[#94a3b8]">Evidence Signal:</span>
              <span className="font-mono text-white px-2 py-0.5 bg-[#0f172a] rounded">{review.agents.news_evidence.evidence_signal}</span>
            </div>
            {review.agents.news_evidence.news_items.length > 0 && (
              <div>
                <strong className="text-white block mb-2">Key News Items:</strong>
                <div className="space-y-2">
                  {review.agents.news_evidence.news_items.map((item, idx) => (
                    <div key={idx} className="bg-[#0f172a] p-3 rounded border border-[#334155]">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-white">{item.headline}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-[#1e293b] rounded text-[#94a3b8] whitespace-nowrap ml-2">{item.sentiment}</span>
                      </div>
                      <div className="text-xs text-[#64748b]">
                        {item.publisher} &bull; {item.category}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
             <div>
              <strong className="text-white block mb-1">Reasoning:</strong>
              <ul className="list-disc pl-5 text-[#94a3b8]">
                {review.agents.news_evidence.reasoning.map((r, idx) => <li key={idx}>{r}</li>)}
              </ul>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem title="Behavioural Coach" icon={Activity}>
           <div className="space-y-3 text-sm">
            <div className="flex gap-2 items-center mb-2">
              <span className="text-[#94a3b8]">Status:</span>
              <span className="font-mono text-white px-2 py-0.5 bg-[#0f172a] rounded">{review.agents.behaviour.behaviour_status}</span>
            </div>
            {review.agents.behaviour.detected_patterns.length > 0 && (
              <div>
                <strong className="text-white block mb-2">Detected Patterns:</strong>
                <div className="space-y-2">
                  {review.agents.behaviour.detected_patterns.map((p, idx) => (
                    <div key={idx} className="bg-[#0f172a] p-3 rounded border border-[#334155]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{p.pattern}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${p.severity === 'HIGH' ? 'bg-red-950/50 text-red-400' : p.severity === 'MEDIUM' ? 'bg-amber-950/50 text-amber-400' : 'bg-[#1e293b] text-[#94a3b8]'}`}>
                          {p.severity}
                        </span>
                      </div>
                      <p className="text-[#94a3b8] mb-1">{p.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
             <div>
              <strong className="text-white block mb-1">Reasoning:</strong>
              <ul className="list-disc pl-5 text-[#94a3b8]">
                {review.agents.behaviour.reasoning.map((r, idx) => <li key={idx}>{r}</li>)}
              </ul>
            </div>
          </div>
        </AccordionItem>
      </div>

      {/* Reviewer Summary */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">Committee Review</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <strong className="text-emerald-400 block mb-2 flex items-center gap-1"><ChevronUp className="w-4 h-4"/> Supporting Evidence</strong>
            <ul className="list-disc pl-5 space-y-1 text-[#94a3b8]">
              {review.agents.reviewer.supporting_evidence.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
          <div>
            <strong className="text-red-400 block mb-2 flex items-center gap-1"><ChevronDown className="w-4 h-4"/> Counter Evidence</strong>
            <ul className="list-disc pl-5 space-y-1 text-[#94a3b8]">
              {review.agents.reviewer.counter_evidence.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-[#334155] text-sm text-[#94a3b8]">
          <strong className="text-white mb-1 block">Final Reasoning:</strong>
          <p>{review.agents.reviewer.reasoning.join(' ')}</p>
        </div>
      </div>

      {/* Educational Disclaimer */}
      <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 flex gap-3 text-indigo-300/80 text-xs">
        <Info className="w-5 h-5 shrink-0" />
        <p>{review.disclaimer}</p>
      </div>
      
    </div>
  );
}
