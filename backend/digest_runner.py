#!/usr/bin/env python3
"""
YouTube Digest Runner

CLI script to run the complete YouTube digest pipeline:
1. Read channels from config file
2. Fetch and transcribe videos
3. Summarize transcripts with LLM
4. Save digest to file

Usage:
    python digest_runner.py --config channels.yaml
    python digest_runner.py --config channels.yaml --output-dir summaries
"""

import asyncio
import argparse
import yaml
import os
import sys
import logging
from datetime import datetime
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from src.services.youtubeService import YouTubeService
from src.services.llmService import LLMService

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("digest_runner")


def load_config(config_path: str) -> dict:
    """Load configuration from YAML file."""
    logger.info(f"Loading config from: {config_path}")

    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config file not found: {config_path}")

    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)

    logger.info(f"Config loaded successfully")
    return config


async def run_digest(config_path: str, output_dir: str = None):
    """
    Run the complete digest pipeline.

    Args:
        config_path: Path to channels.yaml config file
        output_dir: Optional override for output directory
    """
    print("="*80)
    print("YouTube Digest Runner")
    print("="*80)

    # Load configuration
    config = load_config(config_path)

    # Extract settings
    settings = config.get('settings', {})
    channels_config = config.get('channels', [])
    llm_config = config.get('llm', {})

    # Override output directory if specified
    if output_dir:
        settings['output_dir'] = output_dir

    output_directory = settings.get('output_dir', 'output')

    # Filter enabled channels
    enabled_channels = [
        ch for ch in channels_config
        if ch.get('enabled', True)
    ]

    if not enabled_channels:
        logger.error("No enabled channels found in config")
        return

    channel_names = [ch['name'] for ch in enabled_channels]

    print(f"\n📺 Channels to process: {', '.join(channel_names)}")
    print(f"📁 Output directory: {output_directory}")
    print()

    # Step 1: Fetch and transcribe videos
    print("="*80)
    print("STEP 1: Fetching and transcribing videos...")
    print("="*80)

    youtube_config = {
        'max_videos': settings.get('max_videos_per_channel', 5),
        'days_back': settings.get('days_back', 7),
        'output_dir': output_directory,
        'use_whisper': settings.get('use_whisper', True),
        'whisper_model': settings.get('whisper_model', 'base')
    }

    youtube_service = YouTubeService(youtube_config)

    try:
        video_results = await youtube_service.fetch_and_process_videos(channel_names)
    except Exception as e:
        logger.error(f"Error fetching videos: {str(e)}")
        raise

    # Flatten video results into single list
    all_videos = []
    for channel, videos in video_results.items():
        all_videos.extend(videos)

    # Filter videos with valid transcripts
    valid_videos = [
        v for v in all_videos
        if v.get('transcript_available', False)
    ]

    total_videos = len(all_videos)
    transcribed_videos = len(valid_videos)

    print(f"\n✅ Fetched {total_videos} videos")
    print(f"✅ Successfully transcribed {transcribed_videos} videos")

    if transcribed_videos == 0:
        logger.error("No videos with transcripts found. Cannot generate summary.")
        return

    # Step 2: Summarize with LLM
    print("\n" + "="*80)
    print("STEP 2: Generating AI summary...")
    print("="*80)

    llm_service_config = {
        'provider': llm_config.get('provider', 'openai'),
        'model': llm_config.get('model', 'gpt-4o-mini'),
        'max_tokens': llm_config.get('max_tokens', 2000),
        'temperature': llm_config.get('temperature', 0.3),
        'prompt_template': llm_config.get('prompt_template')
    }

    try:
        llm_service = LLMService(llm_service_config)

        print(f"🤖 Using model: {llm_service_config['model']}")
        print(f"📝 Summarizing {transcribed_videos} video transcripts...")

        summary_result = await llm_service.summarize_transcripts(valid_videos)

        print(f"\n✅ Summary generated")
        print(f"   - Tokens used: {summary_result['tokens_used']:,}")
        print(f"   - Videos processed: {summary_result['videos_processed']}")

    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        raise

    # Step 3: Save summary
    print("\n" + "="*80)
    print("STEP 3: Saving digest...")
    print("="*80)

    try:
        filepath = await llm_service.save_summary_to_file(
            summary_data=summary_result,
            output_dir=output_directory
        )

        print(f"\n✅ Digest saved to: {filepath}")

    except Exception as e:
        logger.error(f"Error saving summary: {str(e)}")
        raise

    # Final summary
    print("\n" + "="*80)
    print("DIGEST COMPLETE!")
    print("="*80)
    print(f"\n📊 Summary:")
    print(f"   - Total videos fetched: {total_videos}")
    print(f"   - Videos with transcripts: {transcribed_videos}")
    print(f"   - Channels processed: {len(channel_names)}")
    print(f"   - LLM tokens used: {summary_result['tokens_used']:,}")
    print(f"   - Output file: {filepath}")
    print()

    return filepath


def main():
    """Main entry point for CLI."""
    parser = argparse.ArgumentParser(
        description='Generate AI digests from YouTube channels',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python digest_runner.py --config channels.yaml
  python digest_runner.py --config channels.yaml --output-dir summaries

Environment Variables:
  OPENAI_API_KEY    Your OpenAI API key (required)
        """
    )

    parser.add_argument(
        '--config',
        default='channels.yaml',
        help='Path to channels configuration file (default: channels.yaml)'
    )

    parser.add_argument(
        '--output-dir',
        help='Override output directory from config'
    )

    args = parser.parse_args()

    # Check for OpenAI API key
    if not os.getenv('OPENAI_API_KEY'):
        print("❌ Error: OPENAI_API_KEY environment variable not set")
        print("\nPlease set your OpenAI API key:")
        print("  export OPENAI_API_KEY='your-api-key-here'  # Linux/Mac")
        print("  set OPENAI_API_KEY=your-api-key-here       # Windows")
        sys.exit(1)

    try:
        # Run the digest pipeline
        asyncio.run(run_digest(args.config, args.output_dir))

    except FileNotFoundError as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}", exc_info=True)
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
