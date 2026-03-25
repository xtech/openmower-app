import type {Theme} from '@mui/material/styles';

export const outerCardStyles = (theme: Theme) => ({
  borderRadius: 2,
  boxShadow: theme.palette.mode === 'dark' ? '0 0 12px -2px rgba(0,0,0,0.8)' : '0 0 12px -2px rgba(0,0,0,0.4)',
  border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.1)',
  background:
    theme.palette.mode === 'dark' ? theme.palette.background.paper : 'rgba(255,255,255,0.8)',
  backdropFilter: 'blur(10px)',
});

export const innerCardStyles = {
  borderRadius: 1,
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  boxShadow: '0 4px 16px -2px rgba(0,0,0,0.3)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
};
