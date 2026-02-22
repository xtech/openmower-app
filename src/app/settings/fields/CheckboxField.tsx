import {Box, Checkbox, FormControlLabel, FormHelperText} from '@mui/material';
import {SettingsFieldWrapper} from '../SettingsFieldWrapper';
import type {CheckboxField as CheckboxFieldType} from '../types';
import {useSettingsField} from '../useSettingsField';

interface CheckboxFieldProps {
  field: CheckboxFieldType;
  path: string;
}

export function CheckboxField({field, path}: CheckboxFieldProps) {
  const {controllerField, hasError, onChange} = useSettingsField(path, false);

  return (
    <SettingsFieldWrapper path={path} currentValue={controllerField.value}>
      <Box sx={{mb: 2}}>
        <FormControlLabel
          control={
            <Checkbox
              checked={!!controllerField.value}
              onChange={(e) => onChange(e.target.checked)}
              name={field.name}
            />
          }
          label={field.label}
          sx={hasError ? {color: 'error.main'} : undefined}
        />
        {field.description && <FormHelperText sx={{ml: 4, mt: -1}}>{field.description}</FormHelperText>}
      </Box>
    </SettingsFieldWrapper>
  );
}
