/**
 * Digest Card Component
 * Card-based view matching the screenshot design
 */
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Article as ArticleIcon,
  Telegram as TelegramIcon,
  YouTube as YouTubeIcon,
  Twitter as TwitterIcon,
  Reddit as RedditIcon,
  RssFeed as RssIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';

const SOURCE_ICONS = {
  telegram: TelegramIcon,
  youtube: YouTubeIcon,
  twitter: TwitterIcon,
  reddit: RedditIcon,
  gnews: RssIcon,
  pytrends: TrendingIcon,
};

const SOURCE_COLORS = {
  reddit: 'hsl(16, 85%, 55%)',
  twitter: 'hsl(200, 95%, 55%)',
  youtube: 'hsl(0, 85%, 55%)',
  telegram: 'hsl(200, 85%, 55%)',
  gnews: 'hsl(32, 95%, 55%)',
  pytrends: 'hsl(235, 85%, 65%)',
};

export default function DigestCard({ digest, onClick }) {
  // Extract sources from config snapshot
  const sources = digest.config_snapshot?.sources || [];

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return `Last run ${diffHours} hours ago`;
    }
    return `Last run ${diffDays} days ago`;
  };

  const frequency = digest.config_snapshot?.timeframe_days === 1 ? 'Daily' : 'Weekly';

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        width: '100%',
        height: 400,
        minHeight: 400,
        maxHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        '&:last-child': { pb: 3 }
      }}>
        {/* Header with Title, Chip & Source Icons */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              color: 'white',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {digest.name || 'Unnamed Digest'}
          </Typography>

          {/* Frequency Chip and Time */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Chip
              label={frequency}
              size="small"
              sx={{
                bgcolor: 'rgba(74, 222, 128, 0.1)',
                color: 'primary.main',
                fontWeight: 500,
                height: 24,
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatTimeAgo(digest.created_at)}
              </Typography>
            </Box>
          </Box>

          {/* Source Logos - directly under chip */}
          {sources.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
              {sources.map((source, idx) => {
                const IconComponent = SOURCE_ICONS[source.source_type];
                return IconComponent ? (
                  <Box
                    key={idx}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: SOURCE_COLORS[source.source_type] || '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconComponent sx={{ fontSize: 16, color: 'white' }} />
                  </Box>
                ) : null;
              })}
            </Box>
          )}
        </Box>

        {/* Summary Section */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <ArticleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Latest Summary
            </Typography>
          </Box>

          {/* Summary Preview with fixed line clamp */}
          <Typography
            variant="body2"
            color="text.primary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.5,
              flex: 1,
            }}
          >
            {digest.summary_text ||
              'Summary will be generated once data collection is complete...'}
          </Typography>
        </Box>

        {/* Footer - always at bottom */}
        <Box sx={{ pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Typography variant="caption" color="text.secondary">
            {digest.item_count || 0} items collected
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
