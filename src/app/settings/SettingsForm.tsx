'use client';

import {Page, PageContent, PageHeader} from '@/components/page';
import {useSelectedMower} from '@/stores/mowersStore';
import JsonSchemaDereferencer from '@json-schema-tools/dereferencer';
import {ExpandMore as ExpandMoreIcon, Save as SaveIcon} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Switch,
  Typography,
} from '@mui/material';
import {createHeadlessForm} from '@remoteoss/json-schema-form';
import type {ValidationResult} from '@remoteoss/json-schema-form';
import mergeAllOf from 'json-schema-merge-allof';
import merge from 'lodash.merge';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FormProvider, useForm, useFormContext, useWatch} from 'react-hook-form';
import {parse as parseYaml} from 'yaml';
import {FieldsetField} from './fields/FieldsetField';
import {SettingsContext} from './SettingsContext';
import {StickyBreadcrumb} from './StickyBreadcrumb';
import {deepMergeNoArrayMerge, getNestedValue, setNestedValue} from './settingsUtils';
import type {Field, FieldsetField as FieldsetFieldType} from './types';
import {jsonSchemaResolver} from './validationResolver';

// TODO: Make this dynamic.
const RELEVANT_DEFAULTS = ['defaults.yaml', 'boards/v1.yaml', 'mowers/YardForce500.yaml'];

interface FormState {
  fields: Field[];
  defaults: Record<string, unknown>;
  handleValidation: (value: Record<string, unknown>) => ValidationResult;
}

export function SettingsForm() {
  const [formState, setFormState] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rpc = useSelectedMower((s) => s?.rpc);

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
        const {fields: formFields, handleValidation} = createHeadlessForm(mergedSchema);

        const newFormState = {
          fields: formFields as unknown as Field[],
          defaults,
          handleValidation: handleValidation as (value: Record<string, unknown>) => ValidationResult,
        };
        setFormState(newFormState);
      } catch (err) {
        console.error('Failed to initialize form:', err);
        setError('Failed to load settings schema');
      }
    }

    initializeForm();
  }, [rpc]);

  if (error) {
    return (
      <Page>
        <PageHeader title="Settings" subtitle="Configure your mower" />
        <PageContent>
          <Typography color="error" sx={{p: 3}}>
            {error}
          </Typography>
        </PageContent>
      </Page>
    );
  }

  if (!formState) {
    return (
      <Page>
        <PageHeader title="Settings" subtitle="Configure your mower" />
        <PageContent>
          <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
            <CircularProgress />
          </Box>
        </PageContent>
      </Page>
    );
  }

  return <SettingsFormContent formState={formState} />;
}

function SettingsFormContent({formState}: {formState: FormState}) {
  const methods = useForm({
    defaultValues: formState.defaults,
    resolver: jsonSchemaResolver(formState.handleValidation),
    mode: 'onChange',
  });

  const confirmedFieldsRef = useRef(new Set<string>());
  const [confirmedFields, setConfirmedFields] = useState(new Set<string>());

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
    },
    [formState, methods],
  );

  function getConfirmedValues(): Record<string, unknown> {
    const allValues = methods.getValues() as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const path of confirmedFieldsRef.current) {
      setNestedValue(result, path, getNestedValue(allValues, path));
    }
    return result;
  }

  const topLevelFieldsets = formState.fields.filter((field) => field.type === 'fieldset') as FieldsetFieldType[];
  const hasChanges = confirmedFields.size > 0;
  const {isValid} = methods.formState;

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
        <Page>
          <PageHeader title="Settings" subtitle="Configure your mower">
            {hasChanges && (
              <Chip
                label={`${confirmedFields.size} change${confirmedFields.size !== 1 ? 's' : ''}`}
                color="secondary"
                size="small"
              />
            )}
          </PageHeader>
          <PageContent>
            <Box sx={{display: 'flex', justifyContent: 'flex-end', mb: 2}}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={!hasChanges || !isValid}
                onClick={() => {
                  console.log('save', getConfirmedValues());
                }}
              >
                Save
              </Button>
            </Box>

            <StickyBreadcrumb />

            {topLevelFieldsets.map((fieldset) => (
              <SettingsAccordion key={fieldset.name} fieldset={fieldset} />
            ))}

            <ConfirmedValuesDebug
              confirmedFieldsRef={confirmedFieldsRef}
              getConfirmedValues={getConfirmedValues}
              defaults={formState.defaults}
            />
          </PageContent>
        </Page>
      </FormProvider>
    </SettingsContext.Provider>
  );
}

function SettingsAccordion({fieldset}: {fieldset: FieldsetFieldType}) {
  const {confirmedFields} = useSettingsContext();

  const changedCount = useMemo(() => {
    let count = 0;
    for (const path of confirmedFields) {
      if (path.startsWith(fieldset.name + '.')) count++;
    }
    return count;
  }, [confirmedFields, fieldset.name]);

  return (
    <Accordion
      disableGutters
      sx={{
        mb: 1.5,
        '&:before': {display: 'none'},
        borderRadius: '12px !important',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        '&.Mui-expanded': {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderColor: 'primary.light',
        },
      }}
      defaultExpanded={false}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        data-section-marker=""
        data-section-level="0"
        data-section-label={fieldset.label}
        sx={{
          bgcolor: 'background.paper',
          '&:hover': {bgcolor: 'action.hover'},
          minHeight: 56,
          '& .MuiAccordionSummary-content': {
            margin: '14px 0',
          },
        }}
      >
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, width: '100%'}}>
          <Typography variant="subtitle1" fontWeight={600}>
            {fieldset.label}
          </Typography>
          {changedCount > 0 && <Chip label={changedCount} size="small" color="primary" sx={{height: 22, minWidth: 22}} />}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{pt: 2, pb: 3}}>
        {fieldset.description && (
          <Typography variant="body2" color="text.secondary" sx={{mb: 2.5}}>
            {fieldset.description}
          </Typography>
        )}
        <FieldsetField field={fieldset} level={0} pathPrefix={fieldset.name} />
      </AccordionDetails>
    </Accordion>
  );
}

import {useSettingsContext} from './SettingsContext';

interface ConfirmedValuesDebugProps {
  confirmedFieldsRef: React.RefObject<Set<string>>;
  getConfirmedValues: () => Record<string, unknown>;
  defaults: Record<string, unknown>;
}

function ConfirmedValuesDebug({confirmedFieldsRef, getConfirmedValues, defaults}: ConfirmedValuesDebugProps) {
  useWatch({});
  const {
    formState: {errors},
  } = useFormContext();

  const [showMerged, setShowMerged] = useState(false);

  const confirmed = getConfirmedValues();
  const isEmpty = confirmedFieldsRef.current.size === 0;

  const merged = deepMergeNoArrayMerge(defaults, confirmed);
  const displayed = showMerged ? merged : confirmed;

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 4,
        p: 2,
        bgcolor: 'background.default',
        borderRadius: 3,
      }}
    >
      <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1}}>
        <Typography variant="subtitle2" color="text.secondary">
          Config to be persisted
        </Typography>
        <FormControlLabel
          control={<Switch size="small" checked={showMerged} onChange={(e) => setShowMerged(e.target.checked)} />}
          label={<Typography variant="caption">Show merged with defaults</Typography>}
          labelPlacement="start"
          sx={{m: 0, gap: 1}}
        />
      </Box>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1.5,
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          color: isEmpty ? 'text.disabled' : 'text.primary',
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          maxHeight: 400,
          overflow: 'auto',
        }}
      >
        {isEmpty && !showMerged ? '(no changes)' : JSON.stringify(displayed, null, 2)}
      </Box>
      {hasErrors && (
        <Box sx={{mt: 2}}>
          <Typography variant="subtitle2" color="error" gutterBottom>
            Validation errors
          </Typography>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              color: 'error.main',
              bgcolor: 'error.main',
              borderRadius: 2,
              // Use semi-transparent background for error
              backgroundColor: 'rgba(244, 67, 54, 0.04)',
              border: '1px solid',
              borderColor: 'error.light',
              maxHeight: 300,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(errors, null, 2)}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
