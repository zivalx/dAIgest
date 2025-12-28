import os
import logging
from typing import List, Dict, Optional
from datetime import datetime
from openai import AsyncOpenAI

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("llm_service")


class LLMService:
    """
    LLM service for summarizing video transcripts using OpenAI.
    """

    def __init__(self, config: Dict):
        """
        Initialize LLM service with configuration.

        Args:
            config: Dictionary containing LLM configuration
                - provider: 'openai' (default)
                - model: GPT model name (e.g., 'gpt-4o-mini')
                - max_tokens: Maximum tokens for response
                - temperature: Sampling temperature
                - api_key: OpenAI API key (optional, falls back to env)
                - prompt_template: Template for summarization prompt
        """
        self.provider = config.get('provider', 'openai')
        self.model = config.get('model', 'gpt-4o-mini')
        self.max_tokens = config.get('max_tokens', 2000)
        self.temperature = config.get('temperature', 0.3)
        self.prompt_template = config.get('prompt_template', self._default_prompt_template())

        # Initialize OpenAI client
        api_key = config.get('api_key') or os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable or pass api_key in config.")

        self.client = AsyncOpenAI(api_key=api_key)
        logger.info(f"LLMService initialized with provider={self.provider}, model={self.model}")

    def _default_prompt_template(self) -> str:
        """Default prompt template for summarization."""
        return """You are a helpful assistant that creates concise summaries of YouTube video transcripts.

Below are transcripts from multiple YouTube videos. Create a comprehensive digest that:
1. Summarizes the key points from each video
2. Identifies common themes across videos
3. Highlights any important insights or takeaways
4. Uses clear, concise language

Format the output as markdown with:
- A brief overview section
- Individual video summaries
- Key themes and insights

Transcripts:
{transcripts}

Please provide the digest summary:"""

    async def summarize_transcripts(
        self,
        video_data: List[Dict],
        custom_prompt: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Summarize multiple video transcripts using LLM.

        Args:
            video_data: List of video dictionaries with metadata and transcripts
            custom_prompt: Optional custom prompt template (overrides config)

        Returns:
            Dictionary with:
                - summary: The generated summary text
                - model: Model used
                - tokens_used: Approximate tokens used
                - videos_processed: Number of videos included
        """
        logger.info(f"Starting summarization for {len(video_data)} videos")

        # Filter out videos without transcripts
        valid_videos = [
            v for v in video_data
            if v.get('transcript_available', False) and v.get('transcript', '').strip()
        ]

        if not valid_videos:
            logger.warning("No valid transcripts found to summarize")
            return {
                'summary': 'No transcripts available to summarize.',
                'model': self.model,
                'tokens_used': 0,
                'videos_processed': 0
            }

        logger.info(f"Processing {len(valid_videos)} videos with valid transcripts")

        # Aggregate transcripts with metadata
        aggregated_text = self._aggregate_transcripts(valid_videos)

        # Prepare prompt
        prompt_template = custom_prompt or self.prompt_template
        prompt = prompt_template.format(transcripts=aggregated_text)

        logger.debug(f"Prompt length: {len(prompt)} characters")

        try:
            # Call OpenAI API
            logger.info(f"Calling OpenAI API with model={self.model}")
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates insightful summaries of video content."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )

            summary = response.choices[0].message.content
            tokens_used = response.usage.total_tokens

            logger.info(f"Summary generated successfully. Tokens used: {tokens_used}")

            return {
                'summary': summary,
                'model': self.model,
                'tokens_used': tokens_used,
                'videos_processed': len(valid_videos),
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            raise

    def _aggregate_transcripts(self, video_data: List[Dict]) -> str:
        """
        Aggregate video transcripts with metadata into a single formatted string.

        Args:
            video_data: List of video dictionaries

        Returns:
            Formatted string with all transcripts and metadata
        """
        aggregated = []

        for i, video in enumerate(video_data, 1):
            video_section = f"""
---
VIDEO {i}: {video.get('title', 'Unknown Title')}
Channel: {video.get('channel', 'Unknown')}
URL: {video.get('url', 'N/A')}
Upload Date: {video.get('upload_date', 'Unknown')}
Duration: {video.get('duration', 0)} seconds
Views: {video.get('view_count', 0):,}

TRANSCRIPT:
{video.get('transcript', '')}
---
"""
            aggregated.append(video_section.strip())

        return '\n\n'.join(aggregated)

    async def save_summary_to_file(
        self,
        summary_data: Dict,
        output_dir: str = 'output',
        filename: Optional[str] = None
    ) -> str:
        """
        Save summary to a markdown file.

        Args:
            summary_data: Dictionary returned from summarize_transcripts
            output_dir: Directory to save the file
            filename: Optional custom filename (defaults to digest_YYYY-MM-DD.md)

        Returns:
            Path to the saved file
        """
        os.makedirs(output_dir, exist_ok=True)

        if not filename:
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            filename = f"digest_{timestamp}.md"

        filepath = os.path.join(output_dir, filename)

        # Format summary with metadata
        content = f"""# YouTube Digest Summary

**Generated:** {summary_data.get('timestamp', datetime.now().isoformat())}
**Model:** {summary_data.get('model', 'Unknown')}
**Videos Processed:** {summary_data.get('videos_processed', 0)}
**Tokens Used:** {summary_data.get('tokens_used', 0):,}

---

{summary_data.get('summary', 'No summary available.')}

---

*Generated by YouTube Digest POC*
"""

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        logger.info(f"Summary saved to: {filepath}")
        return filepath


if __name__ == '__main__':
    # Test the service
    import asyncio

    # Sample test data
    test_videos = [
        {
            'title': 'Test Video 1',
            'channel': 'TestChannel',
            'url': 'https://youtube.com/watch?v=test1',
            'upload_date': '20251201',
            'duration': 600,
            'view_count': 10000,
            'transcript': 'This is a test transcript about AI and machine learning.',
            'transcript_available': True
        },
        {
            'title': 'Test Video 2',
            'channel': 'TestChannel',
            'url': 'https://youtube.com/watch?v=test2',
            'upload_date': '20251202',
            'duration': 400,
            'view_count': 5000,
            'transcript': 'This is another test transcript discussing software development.',
            'transcript_available': True
        }
    ]

    config = {
        'model': 'gpt-4o-mini',
        'max_tokens': 500,
        'temperature': 0.3
    }

    async def test():
        service = LLMService(config)
        result = await service.summarize_transcripts(test_videos)
        print("\n" + "="*80)
        print("SUMMARY:")
        print("="*80)
        print(result['summary'])
        print("\n" + "="*80)
        print(f"Tokens used: {result['tokens_used']}")
        print(f"Videos processed: {result['videos_processed']}")

        # Save to file
        filepath = await service.save_summary_to_file(result)
        print(f"Saved to: {filepath}")

    # asyncio.run(test())  # Uncomment to test
