/**
 * Settings View - Global credentials and app preferences ONLY
 * Source-specific configs are now handled in the digest creation wizard
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  TextField,
  Button,
  Alert,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore as ExpandIcon, Save as SaveIcon } from '@mui/icons-material';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState(0);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real app, this would save to backend/env
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage global credentials and application preferences
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper
        sx={{
          bgcolor: '#141414',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            px: 2,
            '& .MuiTab-root': {
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'none',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
          }}
        >
          <Tab label="🔑 API Credentials" />
          <Tab label="⚙️ Preferences" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <Alert
              severity="info"
              sx={{
                mb: 3,
                bgcolor: 'rgba(0, 255, 179, 0.1)',
                color: 'white',
                border: '1px solid rgba(0, 255, 179, 0.2)',
              }}
            >
              💡 Store your API keys here once. You'll be prompted to select which credentials to use when creating digests.
            </Alert>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* OpenAI */}
              <Accordion
                sx={{
                  bgcolor: '#1A1A1A',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">🤖 OpenAI</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    label="API Key"
                    placeholder="sk-..."
                    type="password"
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#0A0A0A' } }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: '#00FFB3' }}>platform.openai.com</a>
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {/* Reddit */}
              <Accordion
                sx={{
                  bgcolor: '#1A1A1A',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Typography variant="h6">🔴 Reddit</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Client ID"
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#0A0A0A' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Client Secret"
                        type="password"
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#0A0A0A' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="User Agent"
                        defaultValue="DigestAI/1.0"
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#0A0A0A' } }}
                      />
                    </Grid>
                  </Grid>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Create a Reddit app at <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noreferrer" style={{ color: '#00FFB3' }}>reddit.com/prefs/apps</a>
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {/* PyTrends */}
              <Accordion
                sx={{
                  bgcolor: '#1A1A1A',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Typography variant="h6">📈 Google Trends (PyTrends)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="success" sx={{ bgcolor: 'rgba(74, 222, 128, 0.1)', color: 'white' }}>
                    ✅ No API key required! PyTrends works out of the box.
                  </Alert>
                </AccordionDetails>
              </Accordion>

              {/* Telegram */}
              <Accordion
                sx={{
                  bgcolor: '#1A1A1A',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Typography variant="h6">✈️ Telegram</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="API ID"
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#0A0A0A' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="API Hash"
                        type="password"
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#0A0A0A' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        placeholder="+1234567890"
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#0A0A0A' } }}
                      />
                    </Grid>
                  </Grid>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Create a Telegram app at <a href="https://my.telegram.org/apps" target="_blank" rel="noreferrer" style={{ color: '#00FFB3' }}>my.telegram.org/apps</a>
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {/* xAI (Grok) */}
              <Accordion
                sx={{
                  bgcolor: '#1A1A1A',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandIcon />}>
                  <Typography variant="h6">🤖 xAI (Grok)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    label="API Key"
                    placeholder="xai-..."
                    type="password"
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#0A0A0A' } }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Get your API key from <a href="https://console.x.ai/" target="_blank" rel="noreferrer" style={{ color: '#00FFB3' }}>console.x.ai</a>
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>

            {saved && (
              <Alert severity="success" sx={{ mt: 3, bgcolor: 'rgba(74, 222, 128, 0.1)', color: 'white' }}>
                ✅ Credentials saved successfully!
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{
                  bgcolor: 'primary.main',
                  color: '#000',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                }}
              >
                Save Credentials
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
              Application Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Coming soon: Theme settings, notification preferences, default AI models, and more.
            </Typography>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
