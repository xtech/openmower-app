import {Box, TextField as MuiTextField} from '@mui/material';
import {SettingsFieldWrapper} from '../SettingsFieldWrapper';
import type {TextField as TextFieldType} from '../types';
import {useSettingsField} from '../useSettingsField';

interface TextFieldProps {
  field: TextFieldType;
  path: string;
}

export function TextField({field, path}: TextFieldProps) {
  const {controllerField, hasError, onChange} = useSettingsField(path);

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
          sx={hasError ? {
            '& .MuiOutlinedInput-root fieldset': {borderColor: 'error.main'},
            '& .MuiOutlinedInput-root:hover fieldset': {borderColor: 'error.main'},
            '& .MuiOutlinedInput-root.Mui-focused fieldset': {borderColor: 'error.main'},
            '& .MuiInputLabel-root': {color: 'error.main'},
            '& .MuiInputLabel-root.Mui-focused': {color: 'error.main'},
          } : undefined}
        />
      </Box>
    </SettingsFieldWrapper>
  );
}
