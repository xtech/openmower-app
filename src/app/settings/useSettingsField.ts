import {useController, useFormContext} from 'react-hook-form';
import {useSettingsContext} from './SettingsContext';
import {getNestedValue} from './settingsUtils';

export function useSettingsField(path: string, fallbackDefault: unknown = '') {
  const {control} = useFormContext();
  const {defaults, onFieldChange, confirmedFields, flatFormErrors} = useSettingsContext();

  const {field: controllerField} = useController({
    name: path,
    control,
    defaultValue: getNestedValue(defaults, path) ?? fallbackDefault,
  });

  const isConfirmed = confirmedFields.has(path);
  const hasError = isConfirmed && !!(flatFormErrors?.[path]);

  return {
    controllerField,
    hasError,
    onChange: (value: unknown) => {
      onFieldChange(path);
      controllerField.onChange(value);
    },
  };
}
