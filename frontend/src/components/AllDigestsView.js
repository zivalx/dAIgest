/**
 * All Digests View - Full list of all digests
 * Replaces the old CycleHistory table
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import DigestCard from './DigestCard';
import apiService from '../api/apiService';

export default function AllDigestsView({ onDigestClick, onCreateClick }) {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.listCycles(1, 100);
      setCycles(response.cycles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCycles = cycles.filter((cycle) => {
    const matchesSearch = cycle.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cycle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'white', mb: 0.5 }}>
            All Digests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage all your AI-powered content summaries
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateClick}
          sx={{
            bgcolor: 'primary.main',
            color: '#000',
            fontWeight: 600,
            px: 3,
            py: 1.5,
            borderRadius: 2,
            '&:hover': {
              bgcolor: 'primary.light',
            },
            boxShadow: 'none',
          }}
        >
          New Digest
        </Button>
      </Box>

      {/* Search and Filter */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          placeholder="Search digests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#1A1A1A',
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
            },
          }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{
              bgcolor: '#1A1A1A',
              borderRadius: 2,
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(239, 68, 68, 0.1)', color: 'white' }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'primary.main' }} />
        </Box>
      ) : filteredCycles.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            bgcolor: '#1A1A1A',
            borderRadius: 3,
            border: '1px dashed rgba(255,255,255,0.1)',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            🔮 No digests found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first AI-powered digest to get started'}
          </Typography>
          {!searchQuery && statusFilter === 'all' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreateClick}
              sx={{
                bgcolor: 'primary.main',
                color: '#000',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'primary.light',
                },
              }}
            >
              New Digest
            </Button>
          )}
        </Box>
      ) : (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Showing {filteredCycles.length} of {cycles.length} digests
          </Typography>
          <Grid container spacing={3}>
            {filteredCycles.map((cycle) => (
              <Grid item xs={12} md={6} lg={4} key={cycle.id}>
                <DigestCard digest={cycle} onClick={() => onDigestClick(cycle.id)} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
