import {useController, useFormContext} from 'react-hook-form';
import {useSettingsContext} from './SettingsContext';
import {getNestedValue} from './settingsUtils';

export function useSettingsField(path: string, fallbackDefault: unknown = '') {
  const {control} = useFormContext();
  const {defaults, onFieldChange, confirmedFields} = useSettingsContext();

  const {field: controllerField, fieldState} = useController({
    name: path,
    control,
    defaultValue: getNestedValue(defaults, path) ?? fallbackDefault,
  });

  const isConfirmed = confirmedFields.has(path);
  // Only show error if the field has been interacted with (confirmed)
  const hasError = isConfirmed && !!fieldState.error;

  return {
    controllerField,
    hasError,
    onChange: (value: unknown) => {
      onFieldChange(path);
      controllerField.onChange(value);
    },
  };
}
