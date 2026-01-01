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
  Collapse,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Timer as TimerIcon,
  Storage as StorageIcon,
  MonetizationOn as CostIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import apiService from '../api/apiService';

export default function SummaryViewer({ cycleId, onBack, onDelete }) {
  const [cycleData, setCycleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this digest? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await apiService.deleteCycle(cycleId);
      if (onDelete) {
        await onDelete(); // Refresh the list
      }
      onBack(); // Go back to the list after deleting
    } catch (err) {
      alert('Failed to delete digest: ' + err.message);
      setDeleting(false);
    }
  };

  const handleExportText = () => {
    if (!cycleData) return;

    const { cycle, collected_data, summary, summary_text } = cycleData;

    // Create text content
    let content = `${cycle.name}\n`;
    content += '='.repeat(cycle.name.length) + '\n\n';
    content += `Status: ${cycle.status}\n`;
    content += `Created: ${new Date(cycle.created_at).toLocaleString()}\n`;
    if (cycle.completed_at) {
      content += `Completed: ${new Date(cycle.completed_at).toLocaleString()}\n`;
    }
    content += '\n';

    // Add collected data summary
    content += 'COLLECTED DATA SUMMARY\n';
    content += '----------------------\n\n';
    collected_data.forEach(data => {
      content += `${data.source_type.toUpperCase()}: ${data.source_name || 'N/A'}\n`;
      content += `  Items: ${data.item_count}\n`;
      if (data.data_size_bytes) {
        content += `  Size: ${(data.data_size_bytes / 1024).toFixed(1)} KB\n`;
      }
      if (data.collection_time_ms) {
        content += `  Time: ${(data.collection_time_ms / 1000).toFixed(1)}s\n`;
      }
      content += '\n';
    });

    // Add summary metadata
    if (summary) {
      content += 'SUMMARY METADATA\n';
      content += '----------------\n\n';
      content += `LLM Provider: ${summary.llm_provider} / ${summary.model_name}\n`;
      content += `Cost: $${summary.cost_usd ? summary.cost_usd.toFixed(4) : 'N/A'}\n`;
      content += `Tokens (in/out): ${summary.input_tokens || 'N/A'} / ${summary.output_tokens || 'N/A'}\n`;
      content += `Generation Time: ${summary.generation_time_ms ? (summary.generation_time_ms / 1000).toFixed(1) : 'N/A'}s\n`;
      content += `Word Count: ${summary.summary_word_count || 'N/A'} words\n\n`;
    }

    // Add summary text
    content += 'AI SUMMARY\n';
    content += '----------\n\n';
    content += summary_text || 'No summary available';

    // Create download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cycle.name || 'digest'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    if (!cycleData) return;

    // Dynamic import of jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const { cycle, collected_data, summary, summary_text } = cycleData;

    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(cycle.name || 'Unnamed Digest', margin, yPos);
    yPos += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Status: ${cycle.status}`, margin, yPos);
    yPos += 6;
    doc.text(`Created: ${new Date(cycle.created_at).toLocaleString()}`, margin, yPos);
    yPos += 6;
    if (cycle.completed_at) {
      doc.text(`Completed: ${new Date(cycle.completed_at).toLocaleString()}`, margin, yPos);
      yPos += 6;
    }
    yPos += 5;

    // Collected Data Summary
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Collected Data Summary', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    collected_data.forEach(data => {
      const sourceText = `${data.source_type.toUpperCase()}: ${data.source_name || 'N/A'} - ${data.item_count} items`;
      doc.text(sourceText, margin, yPos);
      yPos += 6;

      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
    yPos += 5;

    // Summary Metadata
    if (summary) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Summary Metadata', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`LLM: ${summary.llm_provider} / ${summary.model_name}`, margin, yPos);
      yPos += 6;
      doc.text(`Cost: $${summary.cost_usd ? summary.cost_usd.toFixed(4) : 'N/A'}`, margin, yPos);
      yPos += 6;
      doc.text(`Tokens: ${summary.input_tokens || 'N/A'} / ${summary.output_tokens || 'N/A'}`, margin, yPos);
      yPos += 6;
      doc.text(`Word Count: ${summary.summary_word_count || 'N/A'} words`, margin, yPos);
      yPos += 10;
    }

    // AI Summary
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('AI Summary', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    // Split text into lines that fit the page width
    const summaryLines = doc.splitTextToSize(summary_text || 'No summary available', maxWidth);
    summaryLines.forEach(line => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, margin, yPos);
      yPos += 6;
    });

    // Save PDF
    doc.save(`${cycle.name || 'digest'}_${new Date().toISOString().split('T')[0]}.pdf`);
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
      {/* Header with action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<BackIcon />} onClick={onBack}>
          Back to Daigests
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportText}
            sx={{ color: 'primary.main', borderColor: 'primary.main' }}
          >
            Export Text
          </Button>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={handleExportPDF}
            sx={{ color: 'primary.main', borderColor: 'primary.main' }}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Box>
      </Box>

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

        <Divider sx={{ my: 3 }} />

        {/* Raw Collected Data Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CodeIcon sx={{ color: 'text.secondary' }} />
            <Typography variant="h6">
              Raw Collected Data
            </Typography>
            <IconButton
              onClick={() => setShowRawData(!showRawData)}
              sx={{
                transform: showRawData ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>

          <Collapse in={showRawData}>
            {collected_data.map((data, idx) => (
              <Box key={idx} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                  {data.source_type.toUpperCase()}: {data.source_name || 'N/A'} ({data.item_count} items)
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#1e1e1e', overflow: 'auto', maxHeight: 400 }}>
                  <Typography
                    component="pre"
                    sx={{
                      color: '#d4d4d4',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      margin: 0,
                    }}
                  >
                    {JSON.stringify(data.data || {}, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            ))}
            {collected_data.length === 0 && (
              <Alert severity="warning">
                No data was collected. Check collection logs for errors.
              </Alert>
            )}
          </Collapse>
        </Box>
      </Paper>
    </Box>
  );
}
