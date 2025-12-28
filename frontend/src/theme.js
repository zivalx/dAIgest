/**
 * Daigest Design System
 * Matching loveable interface - vibrant cyan with dark blue-gray
 */
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: 'hsl(175, 85%, 50%)', // Bright cyan/turquoise - loveable accent
      light: 'hsl(175, 85%, 60%)',
      dark: 'hsl(175, 85%, 40%)',
      contrastText: 'hsl(220, 20%, 7%)',
    },
    secondary: {
      main: 'hsl(220, 15%, 15%)', // Dark gray - loveable secondary
      light: 'hsl(220, 15%, 20%)',
      dark: 'hsl(220, 15%, 10%)',
      contrastText: 'hsl(210, 20%, 85%)',
    },
    success: {
      main: '#4ADE80',
      light: '#6EE7B7',
      dark: '#22C55E',
    },
    warning: {
      main: '#FBBF24',
      light: '#FCD34D',
      dark: '#F59E0B',
    },
    error: {
      main: '#EF4444', // Destructive red
      light: '#F87171',
      dark: '#DC2626',
    },
    info: {
      main: '#60A5FA',
      light: '#93C5FD',
      dark: '#3B82F6',
    },
    background: {
      default: 'hsl(220, 20%, 7%)', // Dark blue-gray background
      paper: 'hsl(220, 18%, 10%)', // Card background
    },
    text: {
      primary: 'hsl(210, 20%, 95%)', // Light foreground
      secondary: 'hsl(215, 15%, 55%)', // Muted foreground
    },
    divider: 'hsl(220, 15%, 18%)',
    // Source-specific colors from loveable
    sources: {
      telegram: 'hsl(200, 85%, 55%)',
      youtube: 'hsl(0, 85%, 55%)',
      twitter: 'hsl(200, 95%, 55%)',
      reddit: 'hsl(16, 85%, 55%)',
      gnews: 'hsl(32, 95%, 55%)',
      pytrends: 'hsl(235, 85%, 65%)',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none', // No UPPERCASE buttons
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12, // Rounded corners
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    ...Array(18).fill('none'), // Fill remaining shadow levels
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 0 20px hsla(175, 85%, 50%, 0.2)',
          },
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 0 30px hsla(175, 85%, 50%, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'linear-gradient(135deg, hsl(220, 18%, 12%) 0%, hsl(220, 18%, 8%) 100%)',
        },
        elevation1: {
          boxShadow: '0 4px 24px hsla(220, 20%, 4%, 0.4)',
        },
        elevation2: {
          boxShadow: '0 4px 24px hsla(220, 20%, 4%, 0.4), 0 0 40px hsla(175, 85%, 50%, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: 'linear-gradient(135deg, hsl(220, 18%, 12%) 0%, hsl(220, 18%, 8%) 100%)',
          boxShadow: '0 4px 24px hsla(220, 20%, 4%, 0.4)',
          border: '1px solid hsl(220, 15%, 18%)',
          '&:hover': {
            boxShadow: '0 4px 24px hsla(220, 20%, 4%, 0.4), 0 0 40px hsla(175, 85%, 50%, 0.15)',
            transition: 'box-shadow 0.3s ease',
            borderColor: 'hsl(175, 85%, 50%, 0.3)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'hsl(220, 18%, 8%)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        },
      },
    },
  },
});

export default theme;
