/**
 * Cycle Creation Dialog Component
 * Allows users to create new collection/summarization cycles
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import apiService from '../api/apiService';

const TIMEFRAME_OPTIONS = [
  { value: 1, label: '1 Day' },
  { value: 3, label: '3 Days' },
  { value: 7, label: '7 Days (Max)' },
];

const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
];

const LLM_MODELS = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cheap)' },
    { value: 'gpt-4o', label: 'GPT-4o (Best Quality)' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Fast)' },
  ],
};

export default function CycleCreateDialog({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    timeframe_days: 1,
    llm_provider: 'openai',
    llm_model: 'gpt-4o-mini',
  });

  const [selectedConfigs, setSelectedConfigs] = useState([]);
  const [availableConfigs, setAvailableConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      loadSourceConfigs();
    }
  }, [open]);

  const loadSourceConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const configs = await apiService.listSourceConfigs(null, true);
      setAvailableConfigs(configs);
    } catch (err) {
      setError(`Failed to load source configs: ${err.message}`);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });

    // Reset model when provider changes
    if (field === 'llm_provider') {
      setFormData({
        ...formData,
        llm_provider: value,
        llm_model: LLM_MODELS[value][0].value,
      });
    }
  };

  const handleConfigToggle = (config) => {
    const index = selectedConfigs.findIndex((c) => c.id === config.id);
    if (index >= 0) {
      setSelectedConfigs(selectedConfigs.filter((c) => c.id !== config.id));
    } else {
      setSelectedConfigs([...selectedConfigs, config]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Please enter a cycle name');
      return;
    }

    if (selectedConfigs.length === 0) {
      setError('Please select at least one source configuration');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cycleData = {
        name: formData.name,
        timeframe_days: formData.timeframe_days,
        sources: selectedConfigs.map((config) => ({
          source_type: config.source_type,
          credential_ref: config.credential_ref,
          collect_spec: config.collect_spec,
        })),
        llm_provider: formData.llm_provider,
        llm_model: formData.llm_model,
      };

      await apiService.createCycle(cycleData);
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      timeframe_days: 1,
      llm_provider: 'openai',
      llm_model: 'gpt-4o-mini',
    });
    setSelectedConfigs([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: '#1A1A1A',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
          ✨ Create New Digest
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Collect data from your sources and generate an AI summary
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Cycle Name */}
          <TextField
            label="dAIgest Name"
            fullWidth
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="e.g., Tech News Weekly Digest"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* Timeframe Selector */}
          <FormControl fullWidth>
            <InputLabel>Collection Timeframe</InputLabel>
            <Select
              value={formData.timeframe_days}
              label="Collection Timeframe"
              onChange={(e) => handleFieldChange('timeframe_days', e.target.value)}
            >
              {TIMEFRAME_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* LLM Provider */}
          <FormControl fullWidth>
            <InputLabel>LLM Provider</InputLabel>
            <Select
              value={formData.llm_provider}
              label="LLM Provider"
              onChange={(e) => handleFieldChange('llm_provider', e.target.value)}
            >
              {LLM_PROVIDERS.map((provider) => (
                <MenuItem key={provider.value} value={provider.value}>
                  {provider.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* LLM Model */}
          <FormControl fullWidth>
            <InputLabel>LLM Model</InputLabel>
            <Select
              value={formData.llm_model}
              label="LLM Model"
              onChange={(e) => handleFieldChange('llm_model', e.target.value)}
            >
              {LLM_MODELS[formData.llm_provider].map((model) => (
                <MenuItem key={model.value} value={model.value}>
                  {model.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Source Selection */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Select Source Configurations
            </Typography>

            {loadingConfigs ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : availableConfigs.length === 0 ? (
              <Alert severity="info">
                No source configurations found. Please create at least one source
                configuration first.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableConfigs.map((config) => {
                  const isSelected = selectedConfigs.some((c) => c.id === config.id);
                  return (
                    <Chip
                      key={config.id}
                      label={`${config.name} (${config.source_type})`}
                      onClick={() => handleConfigToggle(config)}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                    />
                  );
                })}
              </Box>
            )}
          </Box>

          {selectedConfigs.length > 0 && (
            <Alert
              severity="info"
              sx={{
                borderRadius: 2,
                bgcolor: 'rgba(74, 222, 128, 0.1)',
                border: '1px solid rgba(74, 222, 128, 0.2)',
                color: 'white',
              }}
            >
              ✨ <strong>{selectedConfigs.length} source(s)</strong> selected. Your digest will collect data from
              the past <strong>{formData.timeframe_days} day(s)</strong> and generate an AI summary using{' '}
              <strong>{formData.llm_model}</strong>.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Button onClick={handleClose} disabled={loading} size="large" sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || selectedConfigs.length === 0}
          size="large"
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
          {loading ? <CircularProgress size={24} sx={{ color: '#000' }} /> : '✨ Create Digest'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
