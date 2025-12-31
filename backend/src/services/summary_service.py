"""
Summary Service - LangChain-based LLM summarization.

Replaces direct OpenAI API calls with LangChain abstractions for:
- Multi-provider support (OpenAI, Anthropic, local models)
- Prompt template management
- Token usage tracking
- Cost calculation
"""
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

logger = logging.getLogger(__name__)


class SummaryService:
    """
    LangChain-based summarization service.

    Supports multiple LLM providers with consistent interface.
    """

    # Pricing per 1M tokens (as of 2024)
    PRICING = {
        "gpt-4o-mini": {"input": 0.150, "output": 0.600},
        "gpt-4o": {"input": 2.50, "output": 10.00},
        "gpt-4-turbo": {"input": 10.00, "output": 30.00},
        "claude-3-5-sonnet-20241022": {"input": 3.00, "output": 15.00},
        "claude-3-haiku-20240307": {"input": 0.25, "output": 1.25},
        "grok-beta": {"input": 5.00, "output": 15.00},  # xAI pricing estimate
        "grok-vision-beta": {"input": 5.00, "output": 15.00},
    }

    def __init__(
        self,
        llm_provider: str = "openai",
        model: str = "gpt-4o-mini",
        temperature: float = 0.3,
        max_tokens: int = 2000,
    ):
        """
        Initialize summary service.

        Args:
            llm_provider: "openai", "anthropic", or "xai"
            model: Model name (e.g., "gpt-4o-mini", "claude-3-5-sonnet-20241022", "grok-beta")
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum output tokens
        """
        self.llm_provider = llm_provider
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

        self.llm = self._create_llm()
        self.chain = self._create_chain()

        logger.info(f"SummaryService initialized: provider={llm_provider}, model={model}")

    def _create_llm(self):
        """Create LLM instance based on provider."""
        if self.llm_provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable not set")

            return ChatOpenAI(
                model=self.model,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                api_key=api_key,
            )

        elif self.llm_provider == "anthropic":
            from langchain_anthropic import ChatAnthropic

            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY environment variable not set")

            return ChatAnthropic(
                model=self.model,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                api_key=api_key,
            )

        elif self.llm_provider == "xai":
            # xAI/Grok uses OpenAI-compatible API
            api_key = os.getenv("XAI_API_KEY")
            if not api_key:
                raise ValueError("XAI_API_KEY environment variable not set")

            return ChatOpenAI(
                model=self.model,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                api_key=api_key,
                base_url="https://api.x.ai/v1",  # xAI API endpoint
            )

        else:
            raise ValueError(f"Unsupported LLM provider: {self.llm_provider}")

    def _create_chain(self):
        """Create LangChain processing chain."""
        prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            ("user", "{content}")
        ])

        return prompt | self.llm | StrOutputParser()

    def _get_system_prompt(self) -> str:
        """Get system prompt for summarization."""
        return """You are an expert content summarization assistant. Your task is to analyze and summarize content from various sources (social media, news, videos, etc.) in a clear, concise, and insightful manner.

Guidelines:
1. Identify and highlight key themes, trends, and insights
2. Organize information logically by topic or theme
3. Use clear, professional language
4. Include relevant quotes or data points when significant
5. Provide context for technical or domain-specific content
6. Note any emerging patterns or anomalies
7. Keep the summary focused on actionable insights

Format your summary with:
- Executive Summary (2-3 sentences)
- Key Themes (bulleted list with details)
- Notable Items (specific posts/videos/articles worth highlighting)
- Trends & Insights (patterns observed across sources)
"""

    async def summarize(
        self,
        collected_data: List[Dict[str, Any]],
        custom_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate summary from collected data.

        Args:
            collected_data: List of collection results from orchestrator
            custom_prompt: Optional custom prompt to append to system prompt

        Returns:
            Dict containing:
                - summary_text: Generated summary
                - summary_word_count: Word count
                - input_tokens: Tokens used for input
                - output_tokens: Tokens used for output
                - cost_usd: Estimated cost in USD
                - generation_time_ms: Time taken to generate
                - llm_provider: Provider used
                - model_name: Model used
        """
        start_time = datetime.now()

        # Aggregate content from all sources
        aggregated_content = self._aggregate_content(collected_data)

        # Add custom prompt if provided
        if custom_prompt:
            aggregated_content = f"{aggregated_content}\n\nAdditional Instructions:\n{custom_prompt}"

        # Generate summary
        logger.info(f"Generating summary with {self.model}...")
        try:
            summary_text = await self.chain.ainvoke({"content": aggregated_content})
        except Exception as e:
            logger.error(f"Summary generation failed: {e}", exc_info=True)
            raise

        end_time = datetime.now()
        generation_time_ms = int((end_time - start_time).total_seconds() * 1000)

        # Calculate metrics
        word_count = len(summary_text.split())

        # Estimate token usage (rough approximation: 1 token ≈ 0.75 words)
        input_tokens = int(len(aggregated_content.split()) / 0.75)
        output_tokens = int(word_count / 0.75)

        # Calculate cost
        cost_usd = self._calculate_cost(input_tokens, output_tokens)

        logger.info(
            f"Summary generated: {word_count} words, "
            f"{input_tokens} input tokens, {output_tokens} output tokens, "
            f"${cost_usd:.4f}, {generation_time_ms}ms"
        )

        return {
            "summary_text": summary_text,
            "summary_word_count": word_count,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": round(cost_usd, 4),
            "generation_time_ms": generation_time_ms,
            "llm_provider": self.llm_provider,
            "model_name": self.model,
        }

    def _aggregate_content(self, collected_data: List[Dict[str, Any]]) -> str:
        """
        Aggregate collected data into a single text for summarization.

        Args:
            collected_data: List of collection results

        Returns:
            Aggregated text content
        """
        sections = []

        for collection in collected_data:
            source_type = collection.get("metadata", {}).get("source_type", "unknown")
            source_info = collection.get("source_info", {})
            data = collection.get("data", [])
            item_count = collection.get("item_count", 0)

            sections.append(f"\n{'='*60}")
            sections.append(f"SOURCE: {source_type.upper()}")
            sections.append(f"INFO: {source_info}")
            sections.append(f"ITEMS: {item_count}")
            sections.append(f"{'='*60}\n")

            # Format data based on source type
            if source_type == "reddit":
                sections.append(self._format_reddit_data(data))
            elif source_type == "youtube":
                sections.append(self._format_youtube_data(data))
            elif source_type == "twitter":
                sections.append(self._format_twitter_data(data))
            elif source_type == "telegram":
                sections.append(self._format_telegram_data(data))
            elif source_type == "gnews":
                sections.append(self._format_gnews_data(data))
            elif source_type == "pytrends":
                sections.append(self._format_pytrends_data(data))
            else:
                sections.append(f"[{item_count} items from {source_type}]")

        return "\n".join(sections)

    def _format_reddit_data(self, posts: List[Dict]) -> str:
        """Format Reddit posts for summarization."""
        lines = []
        for post in posts[:50]:  # Limit to 50 posts to avoid token limits
            lines.append(f"\nPost: {post.get('title', 'No title')}")
            lines.append(f"Subreddit: r/{post.get('subreddit', 'unknown')}")
            lines.append(f"Score: {post.get('score', 0)} | Comments: {post.get('num_comments', 0)}")
            if post.get('selftext'):
                lines.append(f"Content: {post['selftext'][:500]}...")
        return "\n".join(lines)

    def _format_youtube_data(self, videos: List[Dict]) -> str:
        """Format YouTube videos for summarization."""
        lines = []
        for video in videos[:20]:  # Limit to 20 videos
            lines.append(f"\nVideo: {video.get('title', 'No title')}")
            lines.append(f"Channel: {video.get('channel', 'unknown')}")
            lines.append(f"Duration: {video.get('duration', 0)}s | Views: {video.get('view_count', 0)}")
            if video.get('transcript'):
                lines.append(f"Transcript: {video['transcript'][:1000]}...")
        return "\n".join(lines)

    def _format_twitter_data(self, tweets: List[Dict]) -> str:
        """Format Twitter tweets for summarization."""
        lines = []
        for tweet in tweets[:100]:  # Limit to 100 tweets
            lines.append(f"\nTweet: {tweet.get('text', 'No text')}")
            lines.append(f"Likes: {tweet.get('like_count', 0)} | Retweets: {tweet.get('retweet_count', 0)}")
        return "\n".join(lines)

    def _format_telegram_data(self, messages: List[Dict]) -> str:
        """Format Telegram messages for summarization."""
        lines = []
        for msg in messages[:100]:  # Limit to 100 messages
            text = msg.get('text') or 'No text'  # Handle None values
            channel = msg.get('channel', 'unknown')
            lines.append(f"\n[{channel}] {text[:200]}")
        return "\n".join(lines)

    def _format_gnews_data(self, articles: List[Dict]) -> str:
        """Format GNews articles for summarization."""
        lines = []
        for article in articles:
            lines.append(f"\nArticle: {article.get('title', 'No title')}")
            lines.append(f"Source: {article.get('source_name', 'unknown')}")
            lines.append(f"Published: {article.get('published_at', 'unknown')}")
            lines.append(f"Description: {article.get('description', 'No description')}")
        return "\n".join(lines)

    def _format_pytrends_data(self, trends_data: Dict) -> str:
        """Format PyTrends data for summarization."""
        lines = []

        # Interest over time
        interest = trends_data.get("interest_over_time", [])
        if interest:
            lines.append(f"\nTrend Data Points: {len(interest)}")
            lines.append("Recent trends:")
            for point in interest[-10:]:  # Last 10 data points
                lines.append(f"  {point.get('date')}: {point.get('keyword')} = {point.get('interest')}")

        # Related queries
        related = trends_data.get("related_queries_top", {})
        if related:
            lines.append("\nTop Related Queries:")
            for keyword, queries in related.items():
                lines.append(f"  {keyword}:")
                for query in queries[:5]:  # Top 5 queries
                    lines.append(f"    - {query.get('query')} ({query.get('value')})")

        return "\n".join(lines)

    def _calculate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """
        Calculate estimated cost based on token usage.

        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens

        Returns:
            Cost in USD
        """
        pricing = self.PRICING.get(self.model)
        if not pricing:
            logger.warning(f"Pricing not available for model {self.model}, returning 0")
            return 0.0

        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]

        return input_cost + output_cost
