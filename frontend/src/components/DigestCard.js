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
} from '@mui/icons-material';

const SOURCE_ICONS = {
  reddit: '🔴',
  twitter: '🐦',
  youtube: '▶️',
  telegram: '✈️',
  gnews: '📰',
  pytrends: '📈',
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

  // Extract sources from config snapshot
  const sources = digest.config_snapshot?.sources || [];
  const frequency = digest.config_snapshot?.timeframe_days === 1 ? 'Daily' : 'Weekly';

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              color: 'white',
            }}
          >
            {digest.name || 'Unnamed Digest'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
        </Box>

        {/* Source Icons */}
        <Box sx={{ mb: 2 }}>
          <AvatarGroup max={5} spacing={8}>
            {sources.map((source, idx) => (
              <Avatar
                key={idx}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: SOURCE_COLORS[source.source_type] || '#666',
                  fontSize: '1rem',
                  border: '2px solid #1A1A1A',
                }}
              >
                {SOURCE_ICONS[source.source_type] || '📄'}
              </Avatar>
            ))}
          </AvatarGroup>
        </Box>

        {/* Latest Summary Label */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <ArticleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Latest Summary
          </Typography>
        </Box>

        {/* Summary Preview */}
        <Typography
          variant="body2"
          color="text.primary"
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.6,
          }}
        >
          {digest.summary_text ||
            'Summary will be generated once data collection is complete...'}
        </Typography>

        {/* Footer */}
        <Typography variant="caption" color="text.secondary">
          {digest.item_count || 0} items collected
        </Typography>
      </CardContent>
    </Card>
  );
}
