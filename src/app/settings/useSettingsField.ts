import {useController, useFormContext} from 'react-hook-form';
import {useSettingsContext} from './SettingsContext';
import {getNestedValue} from './settingsUtils';

export function useSettingsField(path: string, fallbackDefault: unknown = '') {
  const {control} = useFormContext();
  const {defaults, onFieldChange} = useSettingsContext();

  const {field: controllerField} = useController({
    name: path,
    control,
    defaultValue: getNestedValue(defaults, path) ?? fallbackDefault,
  });

  return {
    controllerField,
    onChange: (value: unknown) => {
      controllerField.onChange(value);
      onFieldChange(path);
    },
  };
}
