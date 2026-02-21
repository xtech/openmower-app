import {Checkbox, FormControlLabel, FormHelperText, Box} from '@mui/material';
import {SettingsFieldWrapper} from './SettingsFieldWrapper';
import {useSettingsField} from './useSettingsField';
import type {CheckboxField as CheckboxFieldType} from './types';

interface CheckboxFieldProps {
  field: CheckboxFieldType;
  path: string;
}

export function CheckboxField({field, path}: CheckboxFieldProps) {
  const {controllerField, onChange} = useSettingsField(path, false);

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
        />
        {field.description && (
          <FormHelperText sx={{ml: 4, mt: -1}}>{field.description}</FormHelperText>
        )}
      </Box>
    </SettingsFieldWrapper>
  );
}
