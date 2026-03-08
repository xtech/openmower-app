import {Box, FormControl, FormHelperText, InputLabel, MenuItem, Select} from '@mui/material';
import {SettingsFieldWrapper} from '../SettingsFieldWrapper';
import type {SelectField as SelectFieldType} from '../types';
import {useSettingsField} from '../useSettingsField';

interface SelectFieldProps {
  field: SelectFieldType;
  path: string;
}

export function SelectField({field, path}: SelectFieldProps) {
  const {controllerField, hasError, onChange} = useSettingsField(path);

  const formatDefaultValue = (value: unknown) => {
    const match = field.options?.find((o) => o.value === value);
    return match ? match.label : String(value);
  };

  const labelId = `${path}-label`;

  return (
    <SettingsFieldWrapper path={path} currentValue={controllerField.value} formatDefaultValue={formatDefaultValue}>
      <Box sx={{mb: 2}}>
        <FormControl fullWidth error={hasError}>
          <InputLabel id={labelId}>{field.label}</InputLabel>
          <Select
            labelId={labelId}
            label={field.label}
            name={field.name}
            value={controllerField.value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          >
            {field.options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {field.description && <FormHelperText error={false}>{field.description}</FormHelperText>}
        </FormControl>
      </Box>
    </SettingsFieldWrapper>
  );
}
