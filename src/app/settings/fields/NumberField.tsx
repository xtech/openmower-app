import {Box, TextField as MuiTextField} from '@mui/material';
import {SettingsFieldWrapper} from '../SettingsFieldWrapper';
import type {NumberField as NumberFieldType} from '../types';
import {useSettingsField} from '../useSettingsField';

interface NumberFieldProps {
  field: NumberFieldType;
  path: string;
}

export function NumberField({field, path}: NumberFieldProps) {
  const {controllerField, onChange} = useSettingsField(path);

  const unit = field['x-unit'] ? ` (${field['x-unit']})` : '';

  return (
    <SettingsFieldWrapper path={path} currentValue={controllerField.value}>
      <Box sx={{mb: 2}}>
        <MuiTextField
          fullWidth
          type="number"
          name={field.name}
          label={`${field.label}${unit}`}
          value={controllerField.value ?? ''}
          onChange={(e) => {
            const parsed = field.jsonType === 'integer' ? parseInt(e.target.value, 10) : parseFloat(e.target.value);
            onChange(isNaN(parsed) ? '' : parsed);
          }}
          helperText={field.description}
          inputProps={{
            min: field.minimum,
            max: field.maximum,
            step: field.jsonType === 'integer' ? 1 : 'any',
          }}
          slotProps={{
            formHelperText: {
              sx: {whiteSpace: 'pre-wrap'},
            },
          }}
        />
      </Box>
    </SettingsFieldWrapper>
  );
}
