'use client';
import {createTheme} from '@mui/material/styles';

const sharedTokens = {
  typography: {
    fontFamily: 'var(--font-roboto)',
    h1: {fontWeight: 700, fontSize: '2.5rem'},
    h2: {fontWeight: 600, fontSize: '2rem'},
    h3: {fontWeight: 600, fontSize: '1.75rem'},
    h4: {fontWeight: 500, fontSize: '1.5rem'},
    h5: {fontWeight: 500, fontSize: '1.25rem'},
    h6: {fontWeight: 500, fontSize: '1rem'},
    body1: {fontSize: '1rem', lineHeight: 1.6},
    body2: {fontSize: '0.875rem', lineHeight: 1.5},
    button: {fontWeight: 500, textTransform: 'none' as const},
  },
  shape: {borderRadius: 12},
  palette: {
    primary: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFC107',
      light: '#FFD54F',
      dark: '#FFA000',
      contrastText: '#000000',
    },
    success: {main: '#4CAF50', light: '#81C784', dark: '#388E3C'},
    warning: {main: '#FF9800', light: '#FFB74D', dark: '#F57C00'},
    error: {main: '#F44336', light: '#E57373', dark: '#D32F2F'},
    info: {main: '#2196F3', light: '#64B5F6', dark: '#1976D2'},
  },
};

const componentOverrides = {
  MuiButton: {
    styleOverrides: {
      root: {borderRadius: 8, padding: '8px 16px', fontWeight: 500},
      contained: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        '&:hover': {boxShadow: '0 4px 8px rgba(0,0,0,0.15)'},
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {borderRadius: 12},
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {boxShadow: '0 2px 8px rgba(0,0,0,0.1)'},
    },
  },
};

export const lightTheme = createTheme({
  ...sharedTokens,
  palette: {
    mode: 'light',
    ...sharedTokens.palette,
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  components: {
    ...componentOverrides,
    MuiCard: {
      styleOverrides: {
        root: {
          ...componentOverrides.MuiCard.styleOverrides.root,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  ...sharedTokens,
  palette: {
    mode: 'dark',
    ...sharedTokens.palette,
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#EDEDED',
      secondary: '#AAAAAA',
    },
  },
  components: {
    ...componentOverrides,
    MuiCard: {
      styleOverrides: {
        root: {
          ...componentOverrides.MuiCard.styleOverrides.root,
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#2a2a2a',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#2a2a2a',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#2a2a2a',
        },
      },
    },
  },
});

export default lightTheme;
