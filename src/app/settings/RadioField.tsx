import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import {SettingsFieldWrapper} from './SettingsFieldWrapper';
import {useSettingsField} from './useSettingsField';
import type {RadioField as RadioFieldType} from './types';

interface RadioFieldProps {
  field: RadioFieldType;
  path: string;
}

export function RadioField({field, path}: RadioFieldProps) {
  const {controllerField, onChange} = useSettingsField(path);

  const formatDefaultValue = (value: unknown) => {
    const match = field.options.find((o) => o.value === value);
    return match ? match.label : String(value);
  };

  return (
    <SettingsFieldWrapper path={path} currentValue={controllerField.value} formatDefaultValue={formatDefaultValue}>
      <FormControl component="fieldset" sx={{mb: 3, width: '100%'}}>
        <FormLabel component="legend">{field.label}</FormLabel>
        {field.description && (
          <FormHelperText sx={{mt: 0.5, mb: 1}}>{field.description}</FormHelperText>
        )}
        <RadioGroup
          name={field.name}
          value={controllerField.value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options.map((option) => (
            <div key={option.value}>
              <FormControlLabel value={option.value} control={<Radio />} label={option.label} />
              {option.description && (
                <Typography variant="caption" color="text.secondary" sx={{display: 'block', ml: 4, mt: -1, mb: 1}}>
                  {option.description}
                </Typography>
              )}
            </div>
          ))}
        </RadioGroup>
      </FormControl>
    </SettingsFieldWrapper>
  );
}
