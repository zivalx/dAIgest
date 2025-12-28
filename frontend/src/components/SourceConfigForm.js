/**
 * Source Configuration Form Component
 * Allows users to configure data sources (Reddit, YouTube, etc.)
 */
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import apiService from '../api/apiService';

const SOURCE_TYPES = [
  { value: 'reddit', label: 'Reddit' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'gnews', label: 'Google News' },
  { value: 'pytrends', label: 'Google Trends' },
];

const SOURCE_SPECS = {
  reddit: {
    subreddits: { type: 'array', label: 'Subreddits (comma-separated)' },
    sort: { type: 'select', label: 'Sort', options: ['hot', 'new', 'top', 'rising'] },
    max_posts: { type: 'number', label: 'Max Posts Per Subreddit' },
    include_comments: { type: 'boolean', label: 'Include Comments' },
  },
  youtube: {
    channels: { type: 'array', label: 'Channels (comma-separated)' },
    max_videos: { type: 'number', label: 'Max Videos Per Channel' },
    days_back: { type: 'number', label: 'Days Back' },
    use_transcript_api: { type: 'boolean', label: 'Use Transcript API' },
  },
  telegram: {
    channels: { type: 'array', label: 'Channels (comma-separated)' },
    max_messages: { type: 'number', label: 'Max Messages Per Channel' },
    include_replies: { type: 'boolean', label: 'Include Replies' },
  },
  twitter: {
    query: { type: 'text', label: 'Search Query' },
    max_results: { type: 'number', label: 'Max Results' },
  },
  gnews: {
    query: { type: 'text', label: 'Search Query' },
    language: { type: 'text', label: 'Language (e.g., en)' },
    max_results: { type: 'number', label: 'Max Results' },
  },
  pytrends: {
    keywords: { type: 'array', label: 'Keywords (comma-separated)' },
    timeframe: { type: 'text', label: 'Timeframe (e.g., today 3-m)' },
    geo: { type: 'text', label: 'Geography (e.g., US)' },
  },
};

export default function SourceConfigForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    source_type: 'reddit',
    credential_ref: '',
    enabled: true,
  });

  const [collectSpec, setCollectSpec] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (field === 'source_type') {
      setCollectSpec({}); // Reset collect spec when source type changes
    }
  };

  const handleSpecChange = (specField, value, type) => {
    let processedValue = value;

    if (type === 'array') {
      processedValue = value.split(',').map(v => v.trim()).filter(v => v);
    } else if (type === 'number') {
      processedValue = parseInt(value, 10);
    } else if (type === 'boolean') {
      processedValue = value;
    }

    setCollectSpec({ ...collectSpec, [specField]: processedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiService.createSourceConfig({
        ...formData,
        collect_spec: collectSpec,
      });

      setSuccess(true);
      setFormData({ name: '', source_type: 'reddit', credential_ref: '', enabled: true });
      setCollectSpec({});

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentSpecs = SOURCE_SPECS[formData.source_type] || {};

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Add Source Configuration
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Configuration created successfully!</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Configuration Name"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          required
          margin="normal"
          placeholder="e.g., My Reddit Config"
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Source Type</InputLabel>
          <Select
            value={formData.source_type}
            onChange={(e) => handleFieldChange('source_type', e.target.value)}
            label="Source Type"
          >
            {SOURCE_TYPES.map(type => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Credential Reference"
          value={formData.credential_ref}
          onChange={(e) => handleFieldChange('credential_ref', e.target.value)}
          required
          margin="normal"
          placeholder="e.g., REDDIT_CLIENT_1"
          helperText="Environment variable prefix for credentials"
        />

        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Collection Parameters
        </Typography>

        {Object.entries(currentSpecs).map(([specField, spec]) => {
          if (spec.type === 'boolean') {
            return (
              <FormControlLabel
                key={specField}
                control={
                  <Switch
                    checked={collectSpec[specField] || false}
                    onChange={(e) => handleSpecChange(specField, e.target.checked, 'boolean')}
                  />
                }
                label={spec.label}
              />
            );
          } else if (spec.type === 'select') {
            return (
              <FormControl key={specField} fullWidth margin="normal">
                <InputLabel>{spec.label}</InputLabel>
                <Select
                  value={collectSpec[specField] || spec.options[0]}
                  onChange={(e) => handleSpecChange(specField, e.target.value, 'select')}
                  label={spec.label}
                >
                  {spec.options.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          } else {
            return (
              <TextField
                key={specField}
                fullWidth
                label={spec.label}
                value={collectSpec[specField] || ''}
                onChange={(e) => handleSpecChange(specField, e.target.value, spec.type)}
                margin="normal"
                type={spec.type === 'number' ? 'number' : 'text'}
              />
            );
          }
        })}

        <FormControlLabel
          control={
            <Switch
              checked={formData.enabled}
              onChange={(e) => handleFieldChange('enabled', e.target.checked)}
            />
          }
          label="Enabled"
          sx={{ mt: 2 }}
        />

        <Box sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            fullWidth
          >
            {loading ? 'Creating...' : 'Create Configuration'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
