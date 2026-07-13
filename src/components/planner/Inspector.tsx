'use client';

import {Box, Button, Chip, Divider, Stack, TextField, Typography} from '@mui/material';
import {useMemo} from 'react';
import type {Comments, LineageObject, PlannerPayload} from '@/lib/planner/types';

export default function Inspector({
  payload, selectedId, comments, onComment, onSelect, onExportSummary,
}: {
  payload: PlannerPayload;
  selectedId: string | null;
  comments: Comments;
  onComment: (id: string, text: string) => void;
  onSelect: (id: string | null) => void;
  onExportSummary: (id: string) => void;
}) {
  const objById = useMemo(() => {
    const m = new Map<string, LineageObject>();
    for (const o of payload.lineage.objects) m.set(o.id, o);
    return m;
  }, [payload]);

  const commented = Object.keys(comments).filter((k) => comments[k]?.trim());

  if (!selectedId) {
    return (
      <Box sx={{p: 2}}>
        <Typography variant="subtitle2" gutterBottom>
          Inspector
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click a feature in a stage to see how it was produced and leave
          feedback.
        </Typography>
        {commented.length > 0 && (
          <>
            <Divider sx={{my: 2}} />
            <Typography variant="subtitle2" gutterBottom>
              Feedback ({commented.length})
            </Typography>
            <Stack spacing={0.5}>
              {commented.map((id) => (
                <Box key={id} sx={{cursor: 'pointer'}} onClick={() => onSelect(id)}>
                  <Typography variant="caption" sx={{fontFamily: 'monospace'}}>
                    {id}
                  </Typography>
                  <Typography variant="body2" noWrap>
                    {comments[id]}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}
      </Box>
    );
  }

  const o = objById.get(selectedId);
  if (!o) return <Box sx={{p: 2}}>Unknown object {selectedId}</Box>;

  return (
    <Box sx={{p: 2, overflowY: 'auto', height: '100%'}}>
      <Typography variant="subtitle1" sx={{fontFamily: 'monospace'}}>
        {o.id}
      </Typography>
      <Stack direction="row" spacing={1} sx={{my: 1}}>
        <Chip size="small" label={o.kind} color="primary" />
        <Chip size="small" label={`stage: ${o.stage}`} variant="outlined" />
        <Chip size="small" label={o.op.name} variant="outlined" />
      </Stack>

      {o.op.reason && (
        <Typography variant="body2" sx={{mb: 1}}>
          {o.op.reason}
        </Typography>
      )}

      {Object.keys(o.meta).length > 0 && (
        <Box sx={{mb: 1}}>
          <Typography variant="caption" color="text.secondary">
            meta
          </Typography>
          <Box component="pre" sx={{m: 0, fontSize: 12, whiteSpace: 'pre-wrap'}}>
            {JSON.stringify(o.meta, null, 1)}
          </Box>
        </Box>
      )}

      {o.parents.length > 0 && (
        <Box sx={{mb: 1}}>
          <Typography variant="caption" color="text.secondary">
            produced from
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {o.parents.map((p) => (
              <Chip key={p} size="small" label={p} onClick={() => onSelect(p)}
                sx={{fontFamily: 'monospace'}} />
            ))}
          </Stack>
        </Box>
      )}

      <Divider sx={{my: 1.5}} />
      <TextField
        label="Feedback for an LLM"
        placeholder="e.g. this bend is too aggressive — hug the obstacle closer"
        multiline
        minRows={3}
        fullWidth
        size="small"
        value={comments[o.id] ?? ''}
        onChange={(e) => onComment(o.id, e.target.value)}
      />
      <Button sx={{mt: 1}} size="small" variant="outlined"
        onClick={() => onExportSummary(o.id)}>
        Export this object&apos;s lineage summary
      </Button>
    </Box>
  );
}
