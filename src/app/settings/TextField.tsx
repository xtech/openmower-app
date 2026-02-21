import {Box, TextField as MuiTextField} from '@mui/material';
import {SettingsFieldWrapper} from './SettingsFieldWrapper';
import {useSettingsField} from './useSettingsField';
import type {TextField as TextFieldType} from './types';

interface TextFieldProps {
  field: TextFieldType;
  path: string;
}

export function TextField({field, path}: TextFieldProps) {
  const {controllerField, onChange} = useSettingsField(path);

  return (
    <SettingsFieldWrapper path={path} currentValue={controllerField.value}>
      <Box sx={{mb: 2}}>
        <MuiTextField
          fullWidth
          type="text"
          name={field.name}
          label={field.label}
          value={controllerField.value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          helperText={field.description}
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
