/**
 * Digest Creation Wizard - Multi-step flow
 * Step 1: Name
 * Step 2: Choose sources
 * Step 3: Configure each source
 * Step 4: Timeframe & Schedule
 * Step 5: Review & Run
 */
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Box,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import {
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  PlayArrow as RunIcon,
  Schedule as ScheduleIcon,
  Telegram as TelegramIcon,
  YouTube as YouTubeIcon,
  Twitter as TwitterIcon,
  Reddit as RedditIcon,
  RssFeed as RssIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import apiService from '../api/apiService';

const SOURCE_TYPES = [
  { id: 'telegram', label: 'Telegram', icon: TelegramIcon },
  { id: 'youtube', label: 'YouTube', icon: YouTubeIcon },
  { id: 'twitter', label: 'Twitter / X', icon: TwitterIcon },
  { id: 'reddit', label: 'Reddit', icon: RedditIcon },
  { id: 'gnews', label: 'Google News', icon: RssIcon },
  { id: 'pytrends', label: 'Google Trends', icon: TrendingIcon },
];

const STEPS = ['Name', 'Sources', 'Configure', 'Schedule', 'Review'];

const LLM_MODELS = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cheap)' },
    { value: 'gpt-4o', label: 'GPT-4o (Best Quality)' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  xai: [
    { value: 'grok-beta', label: 'Grok Beta' },
    { value: 'grok-vision-beta', label: 'Grok Vision Beta' },
  ],
};

const DEFAULT_PROMPT = `You are an expert content summarization assistant. Your task is to analyze and summarize content from various sources (social media, news, videos, etc.) in a clear, concise, and insightful manner.

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
- Trends & Insights (patterns observed across sources)`;

export default function DigestWizard({ open, onClose, onSuccess }) {
  const [activeStep, setActiveStep] = useState(0);
  const [digestName, setDigestName] = useState('');
  const [selectedSources, setSelectedSources] = useState([]);
  const [sourceConfigs, setSourceConfigs] = useState({});
  const [timeframeDays, setTimeframeDays] = useState(1);
  const [runMode, setRunMode] = useState('now'); // 'now' or 'schedule'
  const [llmProvider, setLlmProvider] = useState('openai');
  const [llmModel, setLlmModel] = useState('gpt-4o-mini');
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleNext = () => {
    if (activeStep === 0 && !digestName.trim()) {
      setError('Please enter a digest name');
      return;
    }
    if (activeStep === 1 && selectedSources.length === 0) {
      setError('Please select at least one source');
      return;
    }
    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleSourceToggle = (sourceId) => {
    if (selectedSources.includes(sourceId)) {
      setSelectedSources(selectedSources.filter((s) => s !== sourceId));
      const newConfigs = { ...sourceConfigs };
      delete newConfigs[sourceId];
      setSourceConfigs(newConfigs);
    } else {
      setSelectedSources([...selectedSources, sourceId]);
      setSourceConfigs({
        ...sourceConfigs,
        [sourceId]: getDefaultConfig(sourceId),
      });
    }
  };

  const getDefaultConfig = (sourceType) => {
    const defaults = {
      reddit: { subreddits: [], max_posts: 50, sort: 'hot', credential_ref: 'REDDIT_CLIENT_1' },
      youtube: { channels: [], max_videos: 10, credential_ref: 'YOUTUBE_CLIENT_1' },
      telegram: { channels: [], max_messages: 200, credential_ref: 'TELEGRAM_CLIENT_1' },
      twitter: { query: '', max_results: 100, credential_ref: 'TWITTER_CLIENT_1' },
      gnews: { query: '', language: 'en', max_results: 10, credential_ref: 'GNEWS_CLIENT_1' },
      pytrends: { keywords: [], geo: '', credential_ref: 'PYTRENDS' },
    };
    return defaults[sourceType] || {};
  };

  const handleConfigChange = (sourceId, field, value) => {
    setSourceConfigs({
      ...sourceConfigs,
      [sourceId]: {
        ...sourceConfigs[sourceId],
        [field]: value,
      },
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const cycleData = {
        name: digestName,
        timeframe_days: timeframeDays,
        sources: selectedSources.map((sourceId) => ({
          source_type: sourceId,
          credential_ref: sourceConfigs[sourceId].credential_ref,
          collect_spec: { ...sourceConfigs[sourceId] },
        })),
        llm_provider: llmProvider,
        llm_model: llmModel,
        custom_prompt: customPrompt !== DEFAULT_PROMPT ? customPrompt : null,
      };

      await apiService.createCycle(cycleData);
      onSuccess();
      handleReset();
    } catch (err) {
      console.error('Digest creation failed:', err);

      // Provide user-friendly error messages
      let errorMessage = err.message;

      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorMessage = '❌ Cannot connect to backend server. Please ensure the backend is running on port 8001.\n\nRun: cd backend && uvicorn src.main:app --reload --port 8001';
      } else if (err.message.includes('CORS')) {
        errorMessage = '❌ CORS error: Backend is not accepting requests from this origin. Check backend CORS configuration.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setDigestName('');
    setSelectedSources([]);
    setSourceConfigs({});
    setTimeframeDays(1);
    setRunMode('now');
    setCustomPrompt(DEFAULT_PROMPT);
    setError(null);
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Name
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 500 }}>
              Give your digest a memorable name
            </Typography>
            <TextField
              fullWidth
              label="Digest Name"
              value={digestName}
              onChange={(e) => setDigestName(e.target.value)}
              placeholder="e.g., Tech News Daily, Crypto Weekly"
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'hsl(220, 15%, 15%)',
                  borderColor: 'hsl(220, 15%, 18%)',
                  '&:hover fieldset': {
                    borderColor: 'hsla(175, 85%, 50%, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'hsla(175, 85%, 50%, 0.5)',
                  },
                },
              }}
            />
          </Box>
        );

      case 1: // Sources
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', fontWeight: 500 }}>
              Select the platforms you want to monitor
            </Typography>
            <Grid container spacing={2}>
              {SOURCE_TYPES.map((source) => {
                const isSelected = selectedSources.includes(source.id);
                const IconComponent = source.icon;
                return (
                  <Grid item xs={12} sm={6} key={source.id}>
                    <Box
                      onClick={() => handleSourceToggle(source.id)}
                      sx={{
                        cursor: 'pointer',
                        p: 3,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: isSelected
                          ? 'primary.main'
                          : 'hsl(220, 15%, 18%)',
                        bgcolor: isSelected
                          ? 'hsla(175, 85%, 50%, 0.1)'
                          : 'hsl(220, 15%, 15%)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'hsl(220, 15%, 18%)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <IconComponent
                          sx={{
                            width: 16,
                            height: 16,
                            color: isSelected ? 'primary.main' : 'text.secondary',
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: isSelected ? 'text.primary' : 'text.secondary',
                          }}
                        >
                          {source.label}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );

      case 2: // Configure each source
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', fontWeight: 500 }}>
              Provide details for each source you selected
            </Typography>
            {selectedSources.map((sourceId, idx) => {
              const source = SOURCE_TYPES.find((s) => s.id === sourceId);
              const config = sourceConfigs[sourceId] || {};
              const SourceIcon = source?.icon;

              return (
                <Box
                  key={sourceId}
                  sx={{
                    mb: 2.5,
                    p: 3,
                    bgcolor: 'hsl(220, 15%, 15%)',
                    borderRadius: 2,
                    border: '1px solid hsl(220, 15%, 18%)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    {SourceIcon && <SourceIcon sx={{ width: 18, height: 18, color: 'primary.main' }} />}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {source.label}
                    </Typography>
                  </Box>

                  {/* Source-specific config fields */}
                  {sourceId === 'reddit' && (
                    <>
                      <TextField
                        fullWidth
                        label="Subreddits (comma-separated)"
                        value={config.subreddits?.join(', ') || ''}
                        onChange={(e) =>
                          handleConfigChange(
                            sourceId,
                            'subreddits',
                            e.target.value.split(',').map((s) => s.trim())
                          )
                        }
                        placeholder="python, javascript, programming"
                        sx={{
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(220, 15%, 12%)',
                            '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                            '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                          },
                        }}
                      />
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                          value={config.sort || 'hot'}
                          label="Sort By"
                          onChange={(e) => handleConfigChange(sourceId, 'sort', e.target.value)}
                          sx={{ bgcolor: '#0A0A0A' }}
                        >
                          <MenuItem value="hot">Hot</MenuItem>
                          <MenuItem value="new">New</MenuItem>
                          <MenuItem value="top">Top</MenuItem>
                          <MenuItem value="rising">Rising</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        type="number"
                        label="Max Posts"
                        value={config.max_posts || 50}
                        onChange={(e) => handleConfigChange(sourceId, 'max_posts', parseInt(e.target.value))}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(220, 15%, 12%)',
                            '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                            '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                          },
                        }}
                      />
                    </>
                  )}

                  {sourceId === 'pytrends' && (
                    <>
                      <TextField
                        fullWidth
                        label="Keywords (comma-separated)"
                        value={config.keywords?.join(', ') || ''}
                        onChange={(e) =>
                          handleConfigChange(
                            sourceId,
                            'keywords',
                            e.target.value.split(',').map((s) => s.trim())
                          )
                        }
                        placeholder="AI, ChatGPT, Machine Learning"
                        sx={{
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(220, 15%, 12%)',
                            '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                            '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Geographic Region (optional)"
                        value={config.geo || ''}
                        onChange={(e) => handleConfigChange(sourceId, 'geo', e.target.value)}
                        placeholder="US, GB, DE (leave empty for worldwide)"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(220, 15%, 12%)',
                            '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                            '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                          },
                        }}
                      />
                    </>
                  )}

                  {sourceId === 'youtube' && (
                    <>
                      <TextField
                        fullWidth
                        label="Channels (comma-separated)"
                        value={config.channels?.join(', ') || ''}
                        onChange={(e) =>
                          handleConfigChange(
                            sourceId,
                            'channels',
                            e.target.value.split(',').map((s) => s.trim())
                          )
                        }
                        placeholder="@mkbhd, @veritasium, UCXuqSBlHAE6Xw-yeJA0Tunw"
                        sx={{
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(220, 15%, 12%)',
                            '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                            '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        type="number"
                        label="Max Videos per Channel"
                        value={config.max_videos || 10}
                        onChange={(e) => handleConfigChange(sourceId, 'max_videos', parseInt(e.target.value))}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(220, 15%, 12%)',
                            '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                            '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                          },
                        }}
                      />
                    </>
                  )}

                  {sourceId === 'telegram' && (
                    <>
                      <TextField
                        fullWidth
                        label="Channels (comma-separated)"
                        value={config.channels?.join(', ') || ''}
                        onChange={(e) =>
                          handleConfigChange(
                            sourceId,
                            'channels',
                            e.target.value.split(',').map((s) => s.trim())
                          )
                        }
                        placeholder="@telegram, @durov, @channelname"
                        sx={{
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(220, 15%, 12%)',
                            '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                            '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        type="number"
                        label="Max Messages per Channel"
                        value={config.max_messages || 200}
                        onChange={(e) => handleConfigChange(sourceId, 'max_messages', parseInt(e.target.value))}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(220, 15%, 12%)',
                            '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                            '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                          },
                        }}
                      />
                    </>
                  )}

                  {sourceId === 'twitter' && (
                    <>
                      <TextField
                        fullWidth
                        label="Search Query"
                        value={config.query || ''}
                        onChange={(e) => handleConfigChange(sourceId, 'query', e.target.value)}
                        placeholder="AI OR ChatGPT OR OpenAI -spam"
                        sx={{
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(220, 15%, 12%)',
                            '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                            '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        type="number"
                        label="Max Results"
                        value={config.max_results || 100}
                        onChange={(e) => handleConfigChange(sourceId, 'max_results', parseInt(e.target.value))}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(220, 15%, 12%)',
                            '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                            '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                          },
                        }}
                      />
                    </>
                  )}

                  {sourceId === 'gnews' && (
                    <>
                      <TextField
                        fullWidth
                        label="Search Query"
                        value={config.query || ''}
                        onChange={(e) => handleConfigChange(sourceId, 'query', e.target.value)}
                        placeholder="artificial intelligence, technology news"
                        sx={{
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(220, 15%, 12%)',
                            '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                            '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                          },
                        }}
                      />
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Language</InputLabel>
                        <Select
                          value={config.language || 'en'}
                          label="Language"
                          onChange={(e) => handleConfigChange(sourceId, 'language', e.target.value)}
                          sx={{ bgcolor: '#0A0A0A' }}
                        >
                          <MenuItem value="en">English</MenuItem>
                          <MenuItem value="es">Spanish</MenuItem>
                          <MenuItem value="fr">French</MenuItem>
                          <MenuItem value="de">German</MenuItem>
                          <MenuItem value="it">Italian</MenuItem>
                          <MenuItem value="pt">Portuguese</MenuItem>
                          <MenuItem value="ru">Russian</MenuItem>
                          <MenuItem value="zh">Chinese</MenuItem>
                          <MenuItem value="ja">Japanese</MenuItem>
                          <MenuItem value="ar">Arabic</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        type="number"
                        label="Max Results"
                        value={config.max_results || 10}
                        onChange={(e) => handleConfigChange(sourceId, 'max_results', parseInt(e.target.value))}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(220, 15%, 12%)',
                            '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                            '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                          },
                        }}
                      />
                    </>
                  )}
                </Box>
              );
            })}
          </Box>
        );

      case 3: // Schedule
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>
              When should this run?
            </Typography>

            <RadioGroup value={runMode} onChange={(e) => setRunMode(e.target.value)}>
              <FormControlLabel
                value="now"
                control={<Radio sx={{ color: 'primary.main' }} />}
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Run Now
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Execute immediately and collect data
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="schedule"
                control={<Radio sx={{ color: 'primary.main' }} />}
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Schedule for Later
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (Feature coming soon)
                    </Typography>
                  </Box>
                }
                disabled
              />
            </RadioGroup>

            <Box sx={{ mt: 4 }}>
              <Typography variant="body1" sx={{ mb: 2, color: 'white' }}>
                Collection Timeframe
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={timeframeDays}
                  label="Time Period"
                  onChange={(e) => setTimeframeDays(e.target.value)}
                  sx={{
                    bgcolor: 'hsl(220, 15%, 12%)',
                    '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                    '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                  }}
                >
                  <MenuItem value={1}>Last 24 Hours</MenuItem>
                  <MenuItem value={3}>Last 3 Days</MenuItem>
                  <MenuItem value={7}>Last Week</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body1" sx={{ mb: 2, color: 'white' }}>
                AI Model
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={llmProvider}
                  label="Provider"
                  onChange={(e) => {
                    setLlmProvider(e.target.value);
                    setLlmModel(LLM_MODELS[e.target.value][0].value);
                  }}
                  sx={{
                    bgcolor: 'hsl(220, 15%, 12%)',
                    '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                    '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                  }}
                >
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="anthropic">Anthropic (Claude)</MenuItem>
                  <MenuItem value="xai">xAI (Grok)</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Model</InputLabel>
                <Select
                  value={llmModel}
                  label="Model"
                  onChange={(e) => setLlmModel(e.target.value)}
                  sx={{
                    bgcolor: 'hsl(220, 15%, 12%)',
                    '& fieldset': { borderColor: 'hsl(220, 15%, 18%)' },
                    '&:hover fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: 'hsla(175, 85%, 50%, 0.5)' },
                  }}
                >
                  {LLM_MODELS[llmProvider].map((model) => (
                    <MenuItem key={model.value} value={model.value}>
                      {model.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="body1" sx={{ mb: 2, color: 'white' }}>
                Custom Prompt (Optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={8}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Customize how the AI should summarize your content..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#1A1A1A',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                This prompt guides how the AI summarizes your content. The default prompt is pre-filled but you can customize it.
              </Typography>
            </Box>
          </Box>
        );

      case 4: // Review
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, color: 'white' }}>
              Review your digest
            </Typography>
            <Box sx={{ p: 3, bgcolor: '#1A1A1A', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Name
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {digestName}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Sources ({selectedSources.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {selectedSources.map((sourceId) => {
                  const source = SOURCE_TYPES.find((s) => s.id === sourceId);
                  const IconComponent = source?.icon;
                  return (
                    <Chip
                      key={sourceId}
                      label={source.label}
                      icon={IconComponent ? <IconComponent sx={{ fontSize: '1rem' }} /> : null}
                      sx={{ bgcolor: 'rgba(0, 255, 179, 0.1)', color: 'primary.main' }}
                    />
                  );
                })}
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Timeframe
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Last {timeframeDays} {timeframeDays === 1 ? 'day' : 'days'}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                AI Model
              </Typography>
              <Typography variant="body1">
                {llmModel}
              </Typography>
            </Box>

            <Alert
              severity="info"
              sx={{
                mt: 3,
                bgcolor: 'rgba(0, 255, 179, 0.1)',
                color: 'white',
                border: '1px solid rgba(0, 255, 179, 0.2)',
              }}
            >
              {runMode === 'now'
                ? '✨ This digest will run immediately upon creation'
                : '📅 This digest will run on your specified schedule'}
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleReset}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'hsl(220, 18%, 10%)',
          backgroundImage: 'linear-gradient(135deg, hsl(220, 18%, 12%) 0%, hsl(220, 18%, 8%) 100%)',
          borderRadius: 3,
          border: '1px solid hsl(220, 15%, 18%)',
          boxShadow: '0 4px 24px hsla(220, 20%, 4%, 0.4)',
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid hsl(220, 15%, 18%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: 'hsla(175, 85%, 50%, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'primary.main',
              }}
            />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
            Create AI Digest
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Set up an automated digest that summarizes content from your sources
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mt: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    color: 'text.secondary',
                    '&.Mui-active': {
                      color: 'primary.main',
                    },
                    '&.Mui-completed': {
                      color: 'text.secondary',
                    },
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent sx={{ py: 4, minHeight: 300 }}>
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              bgcolor: 'rgba(239, 68, 68, 0.15)',
              color: 'white',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              '& .MuiAlert-icon': {
                color: '#EF4444',
              },
            }}
          >
            <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {error}
            </Box>
          </Alert>
        )}
        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid hsl(220, 15%, 18%)' }}>
        <Button onClick={handleReset} disabled={loading} sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={loading}
            startIcon={<BackIcon />}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'hsl(220, 15%, 18%)',
              },
            }}
          >
            Back
          </Button>
        )}
        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<NextIcon />}
            sx={{
              bgcolor: 'primary.main',
              color: '#000',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'primary.light',
              },
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} sx={{ color: '#000' }} /> : runMode === 'now' ? <RunIcon /> : <ScheduleIcon />}
            sx={{
              bgcolor: 'primary.main',
              color: '#000',
              fontWeight: 600,
              px: 4,
              '&:hover': {
                bgcolor: 'primary.light',
              },
            }}
          >
            {loading ? 'Creating...' : runMode === 'now' ? 'Create & Run Now' : 'Create Digest'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
