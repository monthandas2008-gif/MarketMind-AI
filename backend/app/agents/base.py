from abc import ABC, abstractmethod
from app.models.analysis import AgentResult

class AnalysisAgent(ABC):
    """Base class for all MarketMind analysis agents.
    
    Each agent specializes in one domain of market analysis and produces
    structured results with empirical evidence and confidence ratings.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Agent identifier (e.g., 'technical', 'news', 'anomaly')."""
        ...
    
    @abstractmethod
    async def analyze(self, symbol: str, context: dict) -> AgentResult:
        """Run analysis on a stock given market context.
        
        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            context: Dict containing market_data, news, historical data etc.
            
        Returns:
            AgentResult with findings, signal, evidence, and confidence.
        """
        ...
