/**
 * Summary Viewer Component
 * Displays detailed information about a cycle and its summary
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Timer as TimerIcon,
  Storage as StorageIcon,
  MonetizationOn as CostIcon,
} from '@mui/icons-material';
import apiService from '../api/apiService';

export default function SummaryViewer({ cycleId, onBack }) {
  const [cycleData, setCycleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCycleData();
  }, [cycleId]);

  const loadCycleData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getCycle(cycleId);
      setCycleData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const { cycle, collected_data, summary, summary_text } = cycleData;

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={onBack} sx={{ mb: 2 }}>
        Back to Cycles
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {cycle.name || 'Unnamed Cycle'}
        </Typography>

        <Box display="flex" gap={1} mb={2}>
          <Chip label={cycle.status} color="primary" />
          <Chip label={`Created: ${new Date(cycle.created_at).toLocaleString()}`} variant="outlined" />
          {cycle.completed_at && (
            <Chip
              label={`Completed: ${new Date(cycle.completed_at).toLocaleString()}`}
              variant="outlined"
            />
          )}
        </Box>

        {cycle.error_message && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {cycle.error_message}
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Collected Data Summary
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {collected_data.map((data, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="primary">
                    {data.source_type.toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {data.source_name || 'N/A'}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <StorageIcon fontSize="small" color="action" />
                    <Typography variant="caption">
                      {data.item_count} items
                      {data.data_size_bytes && ` (${(data.data_size_bytes / 1024).toFixed(1)} KB)`}
                    </Typography>
                  </Box>
                  {data.collection_time_ms && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <TimerIcon fontSize="small" color="action" />
                      <Typography variant="caption">
                        {(data.collection_time_ms / 1000).toFixed(1)}s
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {summary && (
          <>
            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Summary Metadata
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">
                  LLM Provider
                </Typography>
                <Typography variant="body1">
                  {summary.llm_provider} / {summary.model_name}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="caption" color="textSecondary">
                    Cost
                  </Typography>
                  <CostIcon fontSize="small" color="action" />
                </Box>
                <Typography variant="body1">
                  ${summary.cost_usd ? summary.cost_usd.toFixed(4) : 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">
                  Tokens (in/out)
                </Typography>
                <Typography variant="body1">
                  {summary.input_tokens || 'N/A'} / {summary.output_tokens || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="caption" color="textSecondary">
                    Generation Time
                  </Typography>
                  <TimerIcon fontSize="small" color="action" />
                </Box>
                <Typography variant="body1">
                  {summary.generation_time_ms ? (summary.generation_time_ms / 1000).toFixed(1) : 'N/A'}s
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">
                  Word Count
                </Typography>
                <Typography variant="body1">
                  {summary.summary_word_count || 'N/A'} words
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              AI Summary
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography
                variant="body1"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  fontFamily: 'inherit',
                }}
              >
                {summary_text || 'No summary available'}
              </Typography>
            </Paper>
          </>
        )}
      </Paper>
    </Box>
  );
}
