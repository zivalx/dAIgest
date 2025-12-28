/**
 * Cycle History Component
 * Displays list of all collection/summarization cycles with pagination
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Typography,
  TablePagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import apiService from '../api/apiService';
import CycleCreateDialog from './CycleCreateDialog';

const STATUS_COLORS = {
  pending: 'default',
  collecting: 'info',
  summarizing: 'warning',
  completed: 'success',
  failed: 'error',
};

export default function CycleHistory({ onViewCycle }) {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCycles, setTotalCycles] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadCycles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.listCycles(page + 1, rowsPerPage);
      setCycles(response.cycles);
      setTotalCycles(response.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, [page, rowsPerPage]);

  const handleDelete = async (cycleId) => {
    if (!window.confirm('Are you sure you want to delete this cycle?')) {
      return;
    }

    try {
      await apiService.deleteCycle(cycleId);
      loadCycles();
    } catch (err) {
      alert(`Failed to delete cycle: ${err.message}`);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading && cycles.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box
        p={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.05) 100%)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            ✨ dAIgest History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your AI-powered data summaries
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              },
            }}
          >
            Create dAIgest
          </Button>
          <IconButton
            onClick={loadCycles}
            disabled={loading}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Box px={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Completed</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cycles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Box>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      🔮 No dAIgests yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create your first AI-powered digest to get started
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              cycles.map((cycle) => (
                <TableRow key={cycle.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{cycle.name || 'Unnamed dAIgest'}</TableCell>
                  <TableCell>
                    <Chip
                      label={cycle.status}
                      color={STATUS_COLORS[cycle.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(cycle.created_at)}</TableCell>
                  <TableCell>{formatDate(cycle.completed_at)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => onViewCycle(cycle.id)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(cycle.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCycles}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 20, 50]}
      />

      <CycleCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          loadCycles();
          setCreateDialogOpen(false);
        }}
      />
    </Paper>
  );
}
