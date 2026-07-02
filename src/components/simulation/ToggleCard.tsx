'use client';

import {Box, CircularProgress, Typography, useTheme} from '@mui/material';
import type {ReactNode} from 'react';

type ToggleColor = 'success' | 'error' | 'warning' | 'info';

interface ToggleOption {
  label: string;
  sub?: string;
  color: ToggleColor;
}

interface ToggleCardProps {
  icon: ReactNode;
  title: string;
  /** Optional explanatory line shown under the title. */
  description?: string;
  value: boolean;
  pending: boolean;
  onChange: (value: boolean) => void;
  /** Option shown/selected when value === true. */
  trueOption: ToggleOption;
  /** Option shown/selected when value === false. */
  falseOption: ToggleOption;
}

export default function ToggleCard({icon, title, description, value, pending, onChange, trueOption, falseOption}: ToggleCardProps) {
  const theme = useTheme();
  const active = value ? trueOption : falseOption;
  const activeColor = theme.palette[active.color].main;

  const Segment = ({option, selected, target}: {option: ToggleOption; selected: boolean; target: boolean}) => (
    <Box
      role="button"
      aria-pressed={selected}
      onClick={() => !pending && !selected && onChange(target)}
      sx={{
        flex: 1,
        textAlign: 'center',
        py: 1,
        px: 1.5,
        borderRadius: 1.5,
        cursor: pending || selected ? 'default' : 'pointer',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        bgcolor: selected ? theme.palette[option.color].main : 'transparent',
        color: selected ? theme.palette[option.color].contrastText : theme.palette.text.secondary,
        fontWeight: selected ? 700 : 500,
        '&:hover': pending || selected ? {} : {bgcolor: theme.palette.action.hover},
      }}
    >
      <Typography variant="body2" fontWeight="inherit" sx={{lineHeight: 1.2}}>
        {option.label}
      </Typography>
      {option.sub && (
        <Typography variant="caption" sx={{opacity: 0.85, display: 'block'}}>
          {option.sub}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box>
      <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mb: 2}}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: `${activeColor}22`,
            color: activeColor,
            transition: 'all 0.2s ease',
          }}
        >
          {icon}
        </Box>
        <Box sx={{flex: 1}}>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary" sx={{display: 'block'}}>
              {description}
            </Typography>
          )}
        </Box>
        {pending && <CircularProgress size={18} />}
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          p: 0.5,
          borderRadius: 2,
          bgcolor: 'action.hover',
          opacity: pending ? 0.6 : 1,
        }}
      >
        <Segment option={falseOption} selected={!value} target={false} />
        <Segment option={trueOption} selected={value} target={true} />
      </Box>
    </Box>
  );
}
