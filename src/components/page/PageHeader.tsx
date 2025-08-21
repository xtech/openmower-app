import {Box, Typography, useTheme} from '@mui/material';
import {PropsWithChildren} from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export default function PageHeader({title, subtitle, children}: PropsWithChildren<PageHeaderProps>) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: 'white',
        pt: 4,
        pb: 6,
        px: 3,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px',
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Box sx={{px: 3}}>
        <Box sx={{position: 'relative', zIndex: 1}}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.1)'}}
          >
            {title}
          </Typography>
          <Typography variant="h5" sx={{opacity: 0.9, fontWeight: 300, mb: 3}}>
            {subtitle}
          </Typography>

          {/* Quick Stats */}
          <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 3, mt: 4}}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}
