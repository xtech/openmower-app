import {RestartAlt as RestartAltIcon} from '@mui/icons-material';
import {Box, IconButton, Tooltip} from '@mui/material';
import {useSettingsContext} from './SettingsContext';
import {deepEqual, getNestedValue} from './settingsUtils';

interface SettingsFieldWrapperProps {
  path: string;
  currentValue: unknown;
  children: React.ReactNode;
  formatDefaultValue?: (value: unknown) => string;
}

export function SettingsFieldWrapper({
  path,
  currentValue,
  children,
  formatDefaultValue,
}: SettingsFieldWrapperProps) {
  const {defaults, confirmedFields, onFieldReset} = useSettingsContext();

  const isConfirmed = confirmedFields.has(path);
  const defaultValue = getNestedValue(defaults, path);

  const isModified = isConfirmed && !deepEqual(currentValue, defaultValue);
  const isPinnedAtDefault = isConfirmed && deepEqual(currentValue, defaultValue);

  const borderColor = isModified ? 'primary.main' : isPinnedAtDefault ? '#c8e6c9' : 'transparent';

  const defaultDisplay = formatDefaultValue ? formatDefaultValue(defaultValue) : formatValue(defaultValue);
  const tooltipTitle = isModified
    ? `Reset to default: ${defaultDisplay}`
    : isPinnedAtDefault
      ? 'Reset to default (currently matches default)'
      : '';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0.5,
        borderLeft: '3px solid',
        borderColor,
        pl: 1,
        transition: 'border-color 0.15s',
      }}
    >
      <Box sx={{flex: 1}}>{children}</Box>
      <Tooltip title={tooltipTitle} placement="left">
        <IconButton
          size="small"
          onClick={() => onFieldReset(path)}
          sx={{
            mt: 1,
            visibility: isConfirmed ? 'visible' : 'hidden',
            color: isConfirmed ? 'primary.main' : 'action.disabled',
            '&:hover': {color: 'primary.main'},
          }}
        >
          <RestartAltIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'none';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
