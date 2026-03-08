import {RestartAlt as RestartAltIcon} from '@mui/icons-material';
import {Box, FormHelperText, IconButton, Tooltip} from '@mui/material';
import type {FieldError} from 'react-hook-form';
import {useFormContext} from 'react-hook-form';
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
  const {
    formState: {errors},
  } = useFormContext();

  const isConfirmed = confirmedFields.has(path);
  const defaultValue = getNestedValue(defaults, path);

  const isModified = isConfirmed && !deepEqual(currentValue, defaultValue);
  const isPinnedAtDefault = isConfirmed && deepEqual(currentValue, defaultValue);

  const fieldErrorObj = getNestedValue(errors, path) as FieldError | undefined;
  const errorMessage = fieldErrorObj?.message;

  const hasError = isConfirmed && !!errorMessage;

  const borderColor = hasError
    ? 'error.main'
    : isModified
      ? 'primary.main'
      : isPinnedAtDefault
        ? 'success.light'
        : 'transparent';

  const bgColor = hasError
    ? 'rgba(244, 67, 54, 0.02)'
    : isModified
      ? 'rgba(76, 175, 80, 0.02)'
      : 'transparent';

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
        pl: 2,
        py: 0.5,
        borderRadius: '0 8px 8px 0',
        bgcolor: bgColor,
        transition: 'all 0.2s ease',
      }}
    >
      <Box sx={{flex: 1}}>
        {children}
        {hasError && errorMessage && (
          <FormHelperText error sx={{mt: -1, mb: 1, mx: 0}}>
            {errorMessage}
          </FormHelperText>
        )}
      </Box>
      <Tooltip title={tooltipTitle} placement="left">
        <span>
          <IconButton
            size="small"
            onClick={() => onFieldReset(path)}
            sx={{
              mt: 1,
              opacity: isConfirmed ? 1 : 0,
              transition: 'opacity 0.15s',
              color: isModified ? 'primary.main' : 'action.active',
              '&:hover': {color: 'primary.main', bgcolor: 'primary.main', backgroundColor: 'rgba(76, 175, 80, 0.08)'},
            }}
            disabled={!isConfirmed}
          >
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'none';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
