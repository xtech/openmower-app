import type {ValidationResult} from '@remoteoss/json-schema-form';
import type {FieldErrors, Resolver} from 'react-hook-form';
import {setNestedValue} from './settingsUtils';

export const jsonSchemaResolver = (
  handleValidation: (values: Record<string, unknown>) => ValidationResult
): Resolver<Record<string, unknown>> => {
  return async (values) => {
    const {formErrors} = handleValidation(values);

    if (!formErrors || Object.keys(formErrors).length === 0) {
      return {values, errors: {}};
    }

    const errors: FieldErrors = {};

    function processErrors(errs: Record<string, unknown>, prefix = '') {
      for (const key of Object.keys(errs)) {
        const val = errs[key];
        const path = prefix ? `${prefix}.${key}` : key;

        if (typeof val === 'string') {
          setNestedValue(errors, path, {type: 'validation', message: val});
        } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
          setNestedValue(errors, path, {type: 'validation', message: val.join(', ')});
        } else if (val && typeof val === 'object') {
          processErrors(val as Record<string, unknown>, path);
        }
      }
    }

    processErrors(formErrors);

    return {values: {}, errors};
  };
};
