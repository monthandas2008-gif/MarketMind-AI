"""
Centralized Indian Equity Instrument Master Service for MarketMind.
Maintains a broad, searchable instrument database across all major sectors of the Indian equity market (NSE).
Supports sub-millisecond local in-memory search, sector filtering, and provider ticker resolution.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime
from app.models.instrument import Instrument, InstrumentSearchResult

logger = logging.getLogger(__name__)

# Verified seed instrument database representing liquid Indian equities across key sectors
SEED_INSTRUMENTS: List[Dict] = [
    # --- BANKING & FINANCIAL SERVICES ---
    {
        "symbol": "HDFCBANK",
        "company_name": "HDFC Bank Limited",
        "exchange": "NSE",
        "isin": "INE040A01034",
        "provider_symbol": "HDFCBANK.NS",
        "sector": "Banking",
        "industry": "Private Sector Bank",
        "market_cap_category": "Large Cap",
        "aliases": ["HDFC", "HDFC Bank", "Housing Development Finance Corp"]
    },
    {
        "symbol": "ICICIBANK",
        "company_name": "ICICI Bank Limited",
        "exchange": "NSE",
        "isin": "INE090A01021",
        "provider_symbol": "ICICIBANK.NS",
        "sector": "Banking",
        "industry": "Private Sector Bank",
        "market_cap_category": "Large Cap",
        "aliases": ["ICICI", "ICICI Bank"]
    },
    {
        "symbol": "SBIN",
        "company_name": "State Bank of India",
        "exchange": "NSE",
        "isin": "INE062A01020",
        "provider_symbol": "SBIN.NS",
        "sector": "Banking",
        "industry": "Public Sector Bank",
        "market_cap_category": "Large Cap",
        "aliases": ["SBI", "State Bank", "State Bank of India"]
    },
    {
        "symbol": "KOTAKBANK",
        "company_name": "Kotak Mahindra Bank Limited",
        "exchange": "NSE",
        "isin": "INE237A01028",
        "provider_symbol": "KOTAKBANK.NS",
        "sector": "Banking",
        "industry": "Private Sector Bank",
        "market_cap_category": "Large Cap",
        "aliases": ["Kotak", "Kotak Bank", "Kotak Mahindra"]
    },
    {
        "symbol": "AXISBANK",
        "company_name": "Axis Bank Limited",
        "exchange": "NSE",
        "isin": "INE238A01034",
        "provider_symbol": "AXISBANK.NS",
        "sector": "Banking",
        "industry": "Private Sector Bank",
        "market_cap_category": "Large Cap",
        "aliases": ["Axis", "Axis Bank", "UTI Bank"]
    },
    {
        "symbol": "BAJFINANCE",
        "company_name": "Bajaj Finance Limited",
        "exchange": "NSE",
        "isin": "INE296A01024",
        "provider_symbol": "BAJFINANCE.NS",
        "sector": "Financial Services",
        "industry": "NBFC",
        "market_cap_category": "Large Cap",
        "aliases": ["Bajaj Finance", "BFL", "Bajaj"]
    },
    {
        "symbol": "BAJAJFINSV",
        "company_name": "Bajaj Finserv Limited",
        "exchange": "NSE",
        "isin": "INE918I01026",
        "provider_symbol": "BAJAJFINSV.NS",
        "sector": "Financial Services",
        "industry": "Asset Management & Holding",
        "market_cap_category": "Large Cap",
        "aliases": ["Bajaj Finserv", "BFS"]
    },

    # --- IT & TECHNOLOGY ---
    {
        "symbol": "TCS",
        "company_name": "Tata Consultancy Services Limited",
        "exchange": "NSE",
        "isin": "INE467B01029",
        "provider_symbol": "TCS.NS",
        "sector": "IT",
        "industry": "IT Consulting & Software",
        "market_cap_category": "Large Cap",
        "aliases": ["Tata Consultancy", "TCS", "Tata"]
    },
    {
        "symbol": "INFY",
        "company_name": "Infosys Limited",
        "exchange": "NSE",
        "isin": "INE009A01021",
        "provider_symbol": "INFY.NS",
        "sector": "IT",
        "industry": "IT Consulting & Software",
        "market_cap_category": "Large Cap",
        "aliases": ["Infosys", "Infy"]
    },
    {
        "symbol": "HCLTECH",
        "company_name": "HCL Technologies Limited",
        "exchange": "NSE",
        "isin": "INE860A01027",
        "provider_symbol": "HCLTECH.NS",
        "sector": "IT",
        "industry": "IT Consulting & Software",
        "market_cap_category": "Large Cap",
        "aliases": ["HCL", "HCL Tech", "HCL Technologies"]
    },
    {
        "symbol": "WIPRO",
        "company_name": "Wipro Limited",
        "exchange": "NSE",
        "isin": "INE075A01022",
        "provider_symbol": "WIPRO.NS",
        "sector": "IT",
        "industry": "IT Consulting & Software",
        "market_cap_category": "Large Cap",
        "aliases": ["Wipro"]
    },
    {
        "symbol": "TECHM",
        "company_name": "Tech Mahindra Limited",
        "exchange": "NSE",
        "isin": "INE669C01036",
        "provider_symbol": "TECHM.NS",
        "sector": "IT",
        "industry": "IT Consulting & Telecom Software",
        "market_cap_category": "Large Cap",
        "aliases": ["Tech Mahindra", "TechM", "Mahindra Tech"]
    },
    {
        "symbol": "LTTS",
        "company_name": "L&T Technology Services Limited",
        "exchange": "NSE",
        "isin": "INE010V01017",
        "provider_symbol": "LTTS.NS",
        "sector": "IT",
        "industry": "Engineering & Technology Services",
        "market_cap_category": "Large Cap",
        "aliases": ["LTTS", "L&T Tech", "L&T Technology Services", "LTIMindtree"]
    },

    # --- ENERGY, OIL & GAS ---
    {
        "symbol": "RELIANCE",
        "company_name": "Reliance Industries Limited",
        "exchange": "NSE",
        "isin": "INE002A01018",
        "provider_symbol": "RELIANCE.NS",
        "sector": "Energy",
        "industry": "Integrated Oil, Gas & Refining",
        "market_cap_category": "Large Cap",
        "aliases": ["RIL", "Reliance", "Jio", "Reliance Retail"]
    },
    {
        "symbol": "ONGC",
        "company_name": "Oil and Natural Gas Corporation Limited",
        "exchange": "NSE",
        "isin": "INE213A01029",
        "provider_symbol": "ONGC.NS",
        "sector": "Energy",
        "industry": "Oil & Gas Exploration",
        "market_cap_category": "Large Cap",
        "aliases": ["ONGC", "Oil & Natural Gas Corp"]
    },
    {
        "symbol": "BPCL",
        "company_name": "Bharat Petroleum Corporation Limited",
        "exchange": "NSE",
        "isin": "INE029A01011",
        "provider_symbol": "BPCL.NS",
        "sector": "Energy",
        "industry": "Refining & Marketing",
        "market_cap_category": "Large Cap",
        "aliases": ["Bharat Petroleum", "BPCL"]
    },
    {
        "symbol": "IOC",
        "company_name": "Indian Oil Corporation Limited",
        "exchange": "NSE",
        "isin": "INE242A01010",
        "provider_symbol": "IOC.NS",
        "sector": "Energy",
        "industry": "Refining & Marketing",
        "market_cap_category": "Large Cap",
        "aliases": ["Indian Oil", "IOCL", "IOC"]
    },

    # --- POWER & UTILITIES ---
    {
        "symbol": "NTPC",
        "company_name": "NTPC Limited",
        "exchange": "NSE",
        "isin": "INE733E01010",
        "provider_symbol": "NTPC.NS",
        "sector": "Power",
        "industry": "Thermal & Renewable Power",
        "market_cap_category": "Large Cap",
        "aliases": ["NTPC", "National Thermal Power"]
    },
    {
        "symbol": "POWERGRID",
        "company_name": "Power Grid Corporation of India Limited",
        "exchange": "NSE",
        "isin": "INE752E01010",
        "provider_symbol": "POWERGRID.NS",
        "sector": "Power",
        "industry": "Power Transmission",
        "market_cap_category": "Large Cap",
        "aliases": ["Power Grid", "PGCIL", "Powergrid"]
    },
    {
        "symbol": "TATAPOWER",
        "company_name": "Tata Power Company Limited",
        "exchange": "NSE",
        "isin": "INE245A01021",
        "provider_symbol": "TATAPOWER.NS",
        "sector": "Power",
        "industry": "Integrated Power Generation",
        "market_cap_category": "Large Cap",
        "aliases": ["Tata Power"]
    },

    # --- AUTO & MOBILITY ---
    {
        "symbol": "TATAMOTORS",
        "company_name": "Tata Motors Limited",
        "exchange": "NSE",
        "isin": "INE155A01022",
        "provider_symbol": "TMPV.NS",
        "sector": "Auto",
        "industry": "Commercial & Passenger Vehicles",
        "market_cap_category": "Large Cap",
        "aliases": ["Tata Motors", "TML", "JLR", "TaMo", "Tata Motor"]
    },
    {
        "symbol": "MARUTI",
        "company_name": "Maruti Suzuki India Limited",
        "exchange": "NSE",
        "isin": "INE585B01010",
        "provider_symbol": "MARUTI.NS",
        "sector": "Auto",
        "industry": "Passenger Cars & Utility Vehicles",
        "market_cap_category": "Large Cap",
        "aliases": ["Maruti", "Maruti Suzuki", "Suzuki"]
    },
    {
        "symbol": "M&M",
        "company_name": "Mahindra & Mahindra Limited",
        "exchange": "NSE",
        "isin": "INE101A01026",
        "provider_symbol": "M&M.NS",
        "sector": "Auto",
        "industry": "Automotive & Farm Equipment",
        "market_cap_category": "Large Cap",
        "aliases": ["Mahindra", "Mahindra and Mahindra", "M and M", "MnM"]
    },
    {
        "symbol": "BAJAJ-AUTO",
        "company_name": "Bajaj Auto Limited",
        "exchange": "NSE",
        "isin": "INE917I01012",
        "provider_symbol": "BAJAJ-AUTO.NS",
        "sector": "Auto",
        "industry": "2 & 3 Wheelers",
        "market_cap_category": "Large Cap",
        "aliases": ["Bajaj Auto", "Bajaj"]
    },
    {
        "symbol": "EICHERMOT",
        "company_name": "Eicher Motors Limited",
        "exchange": "NSE",
        "isin": "INE066A01021",
        "provider_symbol": "EICHERMOT.NS",
        "sector": "Auto",
        "industry": "Premium Motorcycles & CVs",
        "market_cap_category": "Large Cap",
        "aliases": ["Eicher", "Royal Enfield", "Eicher Motors"]
    },
    {
        "symbol": "HEROMOTOCO",
        "company_name": "Hero MotoCorp Limited",
        "exchange": "NSE",
        "isin": "INE158A01026",
        "provider_symbol": "HEROMOTOCO.NS",
        "sector": "Auto",
        "industry": "2 Wheelers",
        "market_cap_category": "Large Cap",
        "aliases": ["Hero", "Hero MotoCorp", "Hero Honda"]
    },

    # --- FMCG & CONSUMER GOODS ---
    {
        "symbol": "ITC",
        "company_name": "ITC Limited",
        "exchange": "NSE",
        "isin": "INE154A01025",
        "provider_symbol": "ITC.NS",
        "sector": "FMCG",
        "industry": "Diversified FMCG & Cigarettes",
        "market_cap_category": "Large Cap",
        "aliases": ["ITC", "ITC Ltd", "Indian Tobacco"]
    },
    {
        "symbol": "HINDUNILVR",
        "company_name": "Hindustan Unilever Limited",
        "exchange": "NSE",
        "isin": "INE030A01027",
        "provider_symbol": "HINDUNILVR.NS",
        "sector": "FMCG",
        "industry": "Household & Personal Products",
        "market_cap_category": "Large Cap",
        "aliases": ["HUL", "Hindustan Unilever", "Unilever"]
    },
    {
        "symbol": "NESTLEIND",
        "company_name": "Nestle India Limited",
        "exchange": "NSE",
        "isin": "INE239A01024",
        "provider_symbol": "NESTLEIND.NS",
        "sector": "FMCG",
        "industry": "Packaged Foods & Beverages",
        "market_cap_category": "Large Cap",
        "aliases": ["Nestle", "Nestle India", "Maggi"]
    },
    {
        "symbol": "BRITANNIA",
        "company_name": "Britannia Industries Limited",
        "exchange": "NSE",
        "isin": "INE216A01030",
        "provider_symbol": "BRITANNIA.NS",
        "sector": "FMCG",
        "industry": "Bakery & Dairy Products",
        "market_cap_category": "Large Cap",
        "aliases": ["Britannia", "Britannia Industries"]
    },
    {
        "symbol": "TITAN",
        "company_name": "Titan Company Limited",
        "exchange": "NSE",
        "isin": "INE280A01028",
        "provider_symbol": "TITAN.NS",
        "sector": "Consumer",
        "industry": "Gems, Jewellery & Watches",
        "market_cap_category": "Large Cap",
        "aliases": ["Titan", "Tanishq", "Titan Company"]
    },
    {
        "symbol": "ASIANPAINT",
        "company_name": "Asian Paints Limited",
        "exchange": "NSE",
        "isin": "INE021A01026",
        "provider_symbol": "ASIANPAINT.NS",
        "sector": "Consumer",
        "industry": "Paints & Coatings",
        "market_cap_category": "Large Cap",
        "aliases": ["Asian Paints", "Asian Paint"]
    },

    # --- PHARMACEUTICALS & HEALTHCARE ---
    {
        "symbol": "SUNPHARMA",
        "company_name": "Sun Pharmaceutical Industries Limited",
        "exchange": "NSE",
        "isin": "INE044A01036",
        "provider_symbol": "SUNPHARMA.NS",
        "sector": "Pharma",
        "industry": "Pharmaceutical Formulations",
        "market_cap_category": "Large Cap",
        "aliases": ["Sun Pharma", "Sun Pharmaceuticals", "SPIL"]
    },
    {
        "symbol": "DRREDDY",
        "company_name": "Dr. Reddy's Laboratories Limited",
        "exchange": "NSE",
        "isin": "INE089A01023",
        "provider_symbol": "DRREDDY.NS",
        "sector": "Pharma",
        "industry": "Generic Pharmaceuticals",
        "market_cap_category": "Large Cap",
        "aliases": ["Dr Reddy", "Dr Reddys", "DRL"]
    },
    {
        "symbol": "CIPLA",
        "company_name": "Cipla Limited",
        "exchange": "NSE",
        "isin": "INE059A01026",
        "provider_symbol": "CIPLA.NS",
        "sector": "Pharma",
        "industry": "Respiratory & Anti-infectives",
        "market_cap_category": "Large Cap",
        "aliases": ["Cipla"]
    },
    {
        "symbol": "DIVISLAB",
        "company_name": "Divi's Laboratories Limited",
        "exchange": "NSE",
        "isin": "INE361B01024",
        "provider_symbol": "DIVISLAB.NS",
        "sector": "Pharma",
        "industry": "Active Pharmaceutical Ingredients",
        "market_cap_category": "Large Cap",
        "aliases": ["Divis", "Divi's Labs"]
    },
    {
        "symbol": "APOLLOHOSP",
        "company_name": "Apollo Hospitals Enterprise Limited",
        "exchange": "NSE",
        "isin": "INE437A01024",
        "provider_symbol": "APOLLOHOSP.NS",
        "sector": "Healthcare",
        "industry": "Hospital Chain & Pharmacies",
        "market_cap_category": "Large Cap",
        "aliases": ["Apollo", "Apollo Hospitals"]
    },

    # --- METALS & MINING ---
    {
        "symbol": "TATASTEEL",
        "company_name": "Tata Steel Limited",
        "exchange": "NSE",
        "isin": "INE081A01020",
        "provider_symbol": "TATASTEEL.NS",
        "sector": "Metals",
        "industry": "Integrated Steel Production",
        "market_cap_category": "Large Cap",
        "aliases": ["Tata Steel", "TISCO"]
    },
    {
        "symbol": "JSWSTEEL",
        "company_name": "JSW Steel Limited",
        "exchange": "NSE",
        "isin": "INE019A01038",
        "provider_symbol": "JSWSTEEL.NS",
        "sector": "Metals",
        "industry": "Steel & Alloy Manufacturing",
        "market_cap_category": "Large Cap",
        "aliases": ["JSW Steel", "JSW"]
    },
    {
        "symbol": "HINDALCO",
        "company_name": "Hindalco Industries Limited",
        "exchange": "NSE",
        "isin": "INE038A01020",
        "provider_symbol": "HINDALCO.NS",
        "sector": "Metals",
        "industry": "Aluminium & Copper",
        "market_cap_category": "Large Cap",
        "aliases": ["Hindalco", "Novelis"]
    },
    {
        "symbol": "COALINDIA",
        "company_name": "Coal India Limited",
        "exchange": "NSE",
        "isin": "INE522F01014",
        "provider_symbol": "COALINDIA.NS",
        "sector": "Metals",
        "industry": "Coal Mining",
        "market_cap_category": "Large Cap",
        "aliases": ["Coal India", "CIL"]
    },

    # --- INFRASTRUCTURE, CAPITAL GOODS & DEFENCE ---
    {
        "symbol": "LT",
        "company_name": "Larsen & Toubro Limited",
        "exchange": "NSE",
        "isin": "INE018A01030",
        "provider_symbol": "LT.NS",
        "sector": "Infrastructure",
        "industry": "Engineering & Construction",
        "market_cap_category": "Large Cap",
        "aliases": ["L&T", "Larsen and Toubro", "Larsen & Toubro"]
    },
    {
        "symbol": "HAL",
        "company_name": "Hindustan Aeronautics Limited",
        "exchange": "NSE",
        "isin": "INE066F01020",
        "provider_symbol": "HAL.NS",
        "sector": "Defence",
        "industry": "Aerospace & Defence Equipment",
        "market_cap_category": "Large Cap",
        "aliases": ["HAL", "Hindustan Aeronautics"]
    },
    {
        "symbol": "BEL",
        "company_name": "Bharat Electronics Limited",
        "exchange": "NSE",
        "isin": "INE263A01024",
        "provider_symbol": "BEL.NS",
        "sector": "Defence",
        "industry": "Defence Electronics & Radars",
        "market_cap_category": "Large Cap",
        "aliases": ["BEL", "Bharat Electronics"]
    },
    {
        "symbol": "ADANIENT",
        "company_name": "Adani Enterprises Limited",
        "exchange": "NSE",
        "isin": "INE423A01024",
        "provider_symbol": "ADANIENT.NS",
        "sector": "Infrastructure",
        "industry": "Diversified Conglomerate",
        "market_cap_category": "Large Cap",
        "aliases": ["Adani", "Adani Enterprises", "AEL"]
    },
    {
        "symbol": "ADANIPORTS",
        "company_name": "Adani Ports and Special Economic Zone Limited",
        "exchange": "NSE",
        "isin": "INE742F01042",
        "provider_symbol": "ADANIPORTS.NS",
        "sector": "Infrastructure",
        "industry": "Ports & Logistics",
        "market_cap_category": "Large Cap",
        "aliases": ["Adani Ports", "APSEZ"]
    },

    # --- TELECOM & MEDIA ---
    {
        "symbol": "BHARTIARTL",
        "company_name": "Bharti Airtel Limited",
        "exchange": "NSE",
        "isin": "INE397D01024",
        "provider_symbol": "BHARTIARTL.NS",
        "sector": "Telecom",
        "industry": "Wireless & Broadband Telecom",
        "market_cap_category": "Large Cap",
        "aliases": ["Airtel", "Bharti Airtel", "Bharti"]
    },

    # --- CEMENT ---
    {
        "symbol": "ULTRACEMCO",
        "company_name": "UltraTech Cement Limited",
        "exchange": "NSE",
        "isin": "INE481G01011",
        "provider_symbol": "ULTRACEMCO.NS",
        "sector": "Cement",
        "industry": "Cement & Building Materials",
        "market_cap_category": "Large Cap",
        "aliases": ["UltraTech", "UltraTech Cement", "Aditya Birla Cement"]
    },
    {
        "symbol": "GRASIM",
        "company_name": "Grasim Industries Limited",
        "exchange": "NSE",
        "isin": "INE047A01021",
        "provider_symbol": "GRASIM.NS",
        "sector": "Cement",
        "industry": "Viscose & Cement",
        "market_cap_category": "Large Cap",
        "aliases": ["Grasim", "Grasim Industries"]
    },

    # --- REALTY ---
    {
        "symbol": "DLF",
        "company_name": "DLF Limited",
        "exchange": "NSE",
        "isin": "INE271C01023",
        "provider_symbol": "DLF.NS",
        "sector": "Realty",
        "industry": "Commercial & Residential Real Estate",
        "market_cap_category": "Large Cap",
        "aliases": ["DLF"]
    },

    # --- RETAIL & CHEMICALS ---
    {
        "symbol": "TRENT",
        "company_name": "Trent Limited",
        "exchange": "NSE",
        "isin": "INE849A01020",
        "provider_symbol": "TRENT.NS",
        "sector": "Consumer",
        "industry": "Retail & Fashion (Westside, Zudio)",
        "market_cap_category": "Large Cap",
        "aliases": ["Trent", "Zudio", "Westside", "Tata Trent"]
    },
    {
        "symbol": "PIDILITIND",
        "company_name": "Pidilite Industries Limited",
        "exchange": "NSE",
        "isin": "INE318A01026",
        "provider_symbol": "PIDILITIND.NS",
        "sector": "Chemicals",
        "industry": "Adhesives & Sealants",
        "market_cap_category": "Large Cap",
        "aliases": ["Pidilite", "Fevicol", "Pidilite Industries"]
    },
]

class InstrumentMasterService:
    """
    Centralized service for managing, indexing, and querying the Indian equity instrument universe.
    """
    def __init__(self):
        self._instruments: Dict[str, Instrument] = {}
        self._initialized = False
        self._init_instruments()

    def _init_instruments(self):
        """Constructs in-memory instruments dictionary from verified seed data."""
        for item in SEED_INSTRUMENTS:
            sym = item["symbol"].upper()
            inst = Instrument(
                instrument_id=f"NSE_{sym}",
                symbol=sym,
                company_name=item["company_name"],
                exchange=item.get("exchange", "NSE"),
                isin=item.get("isin"),
                series=item.get("series", "EQ"),
                provider_symbol=item["provider_symbol"],
                sector=item["sector"],
                industry=item["industry"],
                market_cap_category=item.get("market_cap_category", "Large Cap"),
                is_active=True,
                is_supported=True,
                aliases=item.get("aliases", []),
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat()
            )
            self._instruments[sym] = inst
        self._initialized = True
        logger.info(f"InstrumentMaster initialized with {len(self._instruments)} verified NSE securities.")

    def get_all_instruments(self, active_only: bool = True) -> List[Instrument]:
        """Returns all listed instruments."""
        if not active_only:
            return list(self._instruments.values())
        return [inst for inst in self._instruments.values() if inst.is_active and inst.is_supported]

    def get_instrument(self, symbol: str) -> Optional[Instrument]:
        """Retrieves an instrument by its NSE trading symbol."""
        sym_clean = symbol.upper().strip()
        return self._instruments.get(sym_clean)

    get_by_symbol = get_instrument
    get_all = get_all_instruments

    def resolve_provider_symbol(self, symbol: str) -> Optional[str]:
        """
        Resolves yfinance ticker symbol.
        Checks benchmark indices and instrument master.
        """
        sym_clean = symbol.upper().strip()
        if sym_clean in ("NIFTY50", "NIFTY", "NIFTY 50"):
            return "^NSEI"
        if sym_clean in ("BANKNIFTY", "BANK NIFTY"):
            return "^NSEBANK"
        inst = self.get_instrument(sym_clean)
        if inst and inst.provider_symbol:
            return inst.provider_symbol
        if sym_clean.startswith("^") or sym_clean.endswith(".NS") or sym_clean.endswith(".BO"):
            return sym_clean
        return None

    def search(
        self,
        query: str = "",
        sector: Optional[str] = None,
        limit: int = 50
    ) -> List[Instrument]:
        """
        Fast in-memory search across symbols, company names, sectors, and aliases.
        Guarantees sub-millisecond response without remote API calls.
        """
        q = query.strip().upper()
        results: List[Instrument] = []

        for inst in self._instruments.values():
            if not inst.is_active or not inst.is_supported:
                continue

            # Sector filter
            if sector and sector.upper() != "ALL":
                if inst.sector.upper() != sector.upper():
                    continue

            # Query match
            if not q:
                results.append(inst)
                continue

            # 1. Exact symbol match (Highest priority)
            if inst.symbol == q:
                results.insert(0, inst)
                continue

            # 2. Symbol prefix match
            if inst.symbol.startswith(q):
                results.append(inst)
                continue

            # 3. Company name match
            if q in inst.company_name.upper():
                results.append(inst)
                continue

            # 4. Alias match
            alias_match = False
            for alias in inst.aliases:
                if q in alias.upper():
                    results.append(inst)
                    alias_match = True
                    break
            if alias_match:
                continue

            # 5. Industry / Sector match
            if q in inst.industry.upper() or q in inst.sector.upper():
                results.append(inst)
                continue

        # Deduplicate while preserving order
        seen = set()
        deduped = []
        for r in results:
            if r.symbol not in seen:
                seen.add(r.symbol)
                deduped.append(r)
                if len(deduped) >= limit:
                    break

        return deduped

    def add_custom_instrument(self, instrument: Instrument) -> bool:
        """Enables runtime addition of new instruments without restarting."""
        sym = instrument.symbol.upper()
        self._instruments[sym] = instrument
        logger.info(f"Custom instrument registered: {sym} ({instrument.company_name})")
        return True

instrument_master = InstrumentMasterService()
