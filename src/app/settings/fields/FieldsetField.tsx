import {ExpandMore as ExpandMoreIcon} from '@mui/icons-material';
import {Accordion, AccordionDetails, AccordionSummary, Box, Chip, Typography} from '@mui/material';
import {useMemo} from 'react';
import {FieldRenderer} from '../FieldRenderer';
import {useSettingsContext} from '../SettingsContext';
import type {FieldsetField as FieldsetFieldType} from '../types';

interface FieldsetFieldProps {
  field: FieldsetFieldType;
  level?: number;
  pathPrefix: string;
}

export function FieldsetField({field, level = 0, pathPrefix}: FieldsetFieldProps) {
  if (level === 0) {
    return (
      <>
        {field.fields.map((subField) => (
          <FieldRenderer key={subField.name} field={subField} level={level + 1} pathPrefix={pathPrefix} />
        ))}
      </>
    );
  }

  return <FieldsetAccordion field={field} level={level} pathPrefix={pathPrefix} />;
}

function FieldsetAccordion({field, level, pathPrefix}: {field: FieldsetFieldType; level: number; pathPrefix: string}) {
  const {confirmedFields} = useSettingsContext();

  const changedCount = useMemo(() => {
    let count = 0;
    for (const path of confirmedFields) {
      if (path.startsWith(pathPrefix + '.')) count++;
    }
    return count;
  }, [confirmedFields, pathPrefix]);

  const indent = level - 1;

  return (
    <Accordion
      defaultExpanded
      disableGutters
      sx={{
        mb: 1,
        ml: indent * 1.5,
        '&:before': {display: 'none'},
        borderRadius: '8px !important',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        '&.Mui-expanded': {
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          borderColor: 'primary.light',
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        data-section-marker=""
        data-section-level={String(level)}
        data-section-label={field.label}
        sx={{
          bgcolor: 'background.paper',
          '&:hover': {bgcolor: 'action.hover'},
          minHeight: 48,
          '& .MuiAccordionSummary-content': {
            margin: '12px 0',
          },
        }}
      >
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
          <Typography variant="subtitle2" fontWeight={600}>
            {field.label}
          </Typography>
          {changedCount > 0 && <Chip label={changedCount} size="small" color="primary" sx={{height: 20, minWidth: 20}} />}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{pt: 2, pb: 2}}>
        {field.description && (
          <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
            {field.description}
          </Typography>
        )}
        {field.fields.map((subField) => (
          <FieldRenderer key={subField.name} field={subField} level={level + 1} pathPrefix={pathPrefix} />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}
