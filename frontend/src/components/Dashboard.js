/**
 * Main Dashboard Component
 * Orchestrates all UI components: Source Config, Cycle History, Summary Viewer
 */
import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Typography,
} from '@mui/material';
import SourceConfigForm from './SourceConfigForm';
import CycleHistory from './CycleHistory';
import SummaryViewer from './SummaryViewer';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCycleId, setSelectedCycleId] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    if (newValue !== 1) {
      setSelectedCycleId(null); // Clear selected cycle when switching tabs
    }
  };

  const handleViewCycle = (cycleId) => {
    setSelectedCycleId(cycleId);
    setActiveTab(1); // Switch to Summary tab
  };

  const handleBackToCycles = () => {
    setSelectedCycleId(null);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                fontSize: '1.5rem',
              }}
            >
              🔮
            </Box>
            <Box>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'white',
                }}
              >
                dAIgest
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  display: 'block',
                  lineHeight: 1,
                  mt: -0.5,
                }}
              >
                AI-Powered Data Digests
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Hi, Zi 👋
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          sx={{
            mb: 4,
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 48,
            },
          }}
        >
          <Tab label="📡 Configure Sources" />
          <Tab label="✨ dAIgest History" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <SourceConfigForm
                onSuccess={() => {
                  // Optionally refresh config list or show notification
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 3,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Getting Started
                </Typography>
                <Typography variant="body2" paragraph>
                  1. Configure your data sources by selecting a source type and providing credentials.
                </Typography>
                <Typography variant="body2" paragraph>
                  2. Create collection specifications (subreddits, channels, keywords, etc.).
                </Typography>
                <Typography variant="body2" paragraph>
                  3. Go to "Cycle History" tab to trigger new collection cycles.
                </Typography>
                <Typography variant="body2">
                  4. View AI-generated summaries for each cycle.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <Box>
            {selectedCycleId ? (
              <SummaryViewer cycleId={selectedCycleId} onBack={handleBackToCycles} />
            ) : (
              <CycleHistory onViewCycle={handleViewCycle} />
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}
