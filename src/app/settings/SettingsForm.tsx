'use client';

import {useSelectedMower} from '@/stores/mowersStore';
import JsonSchemaDereferencer from '@json-schema-tools/dereferencer';
import {ExpandMore as ExpandMoreIcon} from '@mui/icons-material';
import {Accordion, AccordionDetails, AccordionSummary, Box, CircularProgress, Paper, Typography} from '@mui/material';
import {createHeadlessForm} from '@remoteoss/json-schema-form';
import mergeAllOf from 'json-schema-merge-allof';
import merge from 'lodash.merge';
import {useCallback, useEffect, useRef, useState} from 'react';
import {FormProvider, useForm, useWatch} from 'react-hook-form';
import {parse as parseYaml} from 'yaml';
import {FieldsetField} from './fields/FieldsetField';
import {SettingsContext} from './SettingsContext';
import {getNestedValue, setNestedValue} from './settingsUtils';
import type {Field, FieldsetField as FieldsetFieldType} from './types';

// TODO: Make this dynamic.
const RELEVANT_DEFAULTS = ['defaults.yaml', 'boards/v1.yaml', 'mowers/YardForce500.yaml'];

interface FormState {
  fields: Field[];
  defaults: Record<string, unknown>;
}

export function SettingsForm() {
  const [formState, setFormState] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rpc = useSelectedMower((s) => s?.rpc);

  const methods = useForm({
    defaultValues: formState?.defaults ?? {},
  });

  // Using a ref for the authoritative set (for getConfirmedValues) and state for re-renders.
  const confirmedFieldsRef = useRef(new Set<string>());
  const [confirmedFields, setConfirmedFields] = useState(new Set<string>());

  useEffect(() => {
    async function initializeForm() {
      if (!rpc) {
        setError('No mower selected');
        return;
      }
      setError(null);

      try {
        const [schema, defaultsFiles] = await Promise.all([rpc.meta.config.schema(), rpc.meta.config.defaults()]);
        const defaults = RELEVANT_DEFAULTS.reduce<Record<string, unknown>>((acc, path) => {
          const parsed = parseYaml(defaultsFiles[path]);
          merge(acc, parsed);
          return acc;
        }, {});

        const dereferencer = new JsonSchemaDereferencer(JSON.parse(schema), {
          recursive: true,
        });
        const dereferencedSchema = await dereferencer.resolve();
        if (typeof dereferencedSchema !== 'object') {
          throw new Error('Dereferenced schema is not an object');
        }
        const mergedSchema = mergeAllOf(dereferencedSchema);
        const {fields: formFields} = createHeadlessForm(mergedSchema);

        setFormState({fields: formFields as unknown as Field[], defaults});
        methods.reset(defaults);
        confirmedFieldsRef.current = new Set<string>();
        setConfirmedFields(new Set<string>());
      } catch (err) {
        console.error('Failed to initialize form:', err);
        setError('Failed to load settings schema');
      }
    }

    initializeForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rpc]);

  const onFieldChange = useCallback((path: string) => {
    confirmedFieldsRef.current.add(path);
    setConfirmedFields((prev) => {
      if (prev.has(path)) return prev;
      return new Set(prev).add(path);
    });
  }, []);

  const onFieldReset = useCallback(
    (path: string) => {
      confirmedFieldsRef.current.delete(path);
      setConfirmedFields((prev) => {
        if (!prev.has(path)) return prev;
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
      const defaultValue = formState ? getNestedValue(formState.defaults, path) : undefined;
      methods.resetField(path as never, {defaultValue: defaultValue as never});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [formState],
  );

  /** Returns a nested object containing only the confirmed (pinned) field values. */
  function getConfirmedValues(): Record<string, unknown> {
    const allValues = methods.getValues() as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const path of confirmedFieldsRef.current) {
      setNestedValue(result, path, getNestedValue(allValues, path));
    }
    return result;
  }

  if (error) {
    return (
      <Box sx={{p: {xs: 2, md: 3}}}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!formState) {
    return (
      <Box sx={{p: {xs: 2, md: 3}, display: 'flex', justifyContent: 'center'}}>
        <CircularProgress />
      </Box>
    );
  }

  const topLevelFieldsets = formState.fields.filter((field) => field.type === 'fieldset') as FieldsetFieldType[];

  return (
    <SettingsContext.Provider
      value={{
        defaults: formState.defaults,
        confirmedFields,
        onFieldChange,
        onFieldReset,
      }}
    >
      <FormProvider {...methods}>
        <Box sx={{p: {xs: 2, md: 3}}}>
          <Typography variant="h4" gutterBottom>
            Settings
          </Typography>

          {topLevelFieldsets.map((fieldset) => (
            <Accordion
              key={fieldset.name}
              sx={{
                mb: 2,
                '&:before': {display: 'none'},
                boxShadow: 1,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1000,
                  bgcolor: 'background.default',
                  '&:hover': {bgcolor: 'action.hover'},
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  fontWeight: 'bold',
                }}
              >
                <Typography variant="h6">{fieldset.label}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{pt: 2}}>
                {fieldset.description && (
                  <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                    {fieldset.description}
                  </Typography>
                )}
                <FieldsetField field={fieldset} level={0} pathPrefix={fieldset.name} />
              </AccordionDetails>
            </Accordion>
          ))}

          <ConfirmedValuesDebug confirmedFieldsRef={confirmedFieldsRef} getConfirmedValues={getConfirmedValues} />
        </Box>
      </FormProvider>
    </SettingsContext.Provider>
  );
}

interface ConfirmedValuesDebugProps {
  confirmedFieldsRef: React.RefObject<Set<string>>;
  getConfirmedValues: () => Record<string, unknown>;
}

function ConfirmedValuesDebug({confirmedFieldsRef, getConfirmedValues}: ConfirmedValuesDebugProps) {
  // Re-render whenever any watched value changes so the panel stays live.
  useWatch({});

  const confirmed = getConfirmedValues();
  const isEmpty = confirmedFieldsRef.current.size === 0;

  return (
    <Paper variant="outlined" sx={{mt: 4, p: 2, bgcolor: 'background.default'}}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Config to be persisted:
      </Typography>
      <Box
        component="pre"
        sx={{
          m: 0,
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          color: isEmpty ? 'text.disabled' : 'text.primary',
        }}
      >
        {isEmpty ? '(no changes)' : JSON.stringify(confirmed, null, 2)}
      </Box>
    </Paper>
  );
}
