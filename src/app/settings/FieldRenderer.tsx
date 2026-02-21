import {Box, Typography} from '@mui/material';
import {CheckboxField} from './fields/CheckboxField';
import {FieldsetField} from './fields/FieldsetField';
import {NumberField} from './fields/NumberField';
import {RadioField} from './fields/RadioField';
import {TextField} from './fields/TextField';
import type {BaseField, Field} from './types';

interface FieldRendererProps {
  field: Field;
  level?: number;
  pathPrefix: string;
}

export function FieldRenderer({field, level = 0, pathPrefix}: FieldRendererProps) {
  if (field.isVisible === false) {
    return null;
  }

  const path = `${pathPrefix}.${field.name}`;

  switch (field.inputType) {
    case 'fieldset':
      return <FieldsetField field={field} level={level} pathPrefix={path} />;

    case 'radio':
      return <RadioField field={field} path={path} />;

    case 'checkbox':
      return <CheckboxField field={field} path={path} />;

    case 'number':
      return <NumberField field={field} path={path} />;

    case 'text':
      return <TextField field={field} path={path} />;

    default:
      const unknownField = field as BaseField;
      return (
        <Box sx={{mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1}}>
          <Typography variant="body2" color="text.secondary">
            Unsupported field type: {unknownField.inputType || unknownField.type} (
            {unknownField.label || unknownField.name})
          </Typography>
        </Box>
      );
  }
}
