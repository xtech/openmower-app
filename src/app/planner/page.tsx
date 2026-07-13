'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert, Box, Button, Chip, Divider, MenuItem, Stack, Tab, Tabs,
  TextField, Typography,
} from '@mui/material';
import {useMowersStore} from '@/stores/mowersStore';
import {mapSchema, type MapData} from '@/stores/schemas';
import {PlannerClient} from '@/lib/planner/client';
import {
  DEFAULT_PARAMS, EXAMPLES, buildSpecFromMap, mowAreas, specFromImport,
} from '@/lib/planner/spec';
import {download, fullExport, narrative, objectSummary} from '@/lib/planner/lineage';
import type {Comments, PlannerPayload, PlannerSpec} from '@/lib/planner/types';
import ParamsPanel, {type Params} from '@/components/planner/ParamsPanel';
import StageViewer from '@/components/planner/StageViewer';
import Inspector from '@/components/planner/Inspector';

type Source =
  | {kind: 'spec'; spec: PlannerSpec; label: string}
  | {kind: 'map'; map: MapData; activeId: string; label: string};

const COMMENTS_KEY = 'planner-studio-comments';

export default function PlannerPage() {
  const [wsUrl, setWsUrl] = useState('ws://localhost:19001');
  const [prefix, setPrefix] = useState('');
  const [status, setStatus] = useState('connecting');
  const clientRef = useRef<PlannerClient | null>(null);

  const [params, setParams] = useState<Params>({...DEFAULT_PARAMS});
  const [source, setSource] = useState<Source>({
    kind: 'spec', spec: EXAMPLES[0].spec, label: EXAMPLES[0].name,
  });
  const [payload, setPayload] = useState<PlannerPayload | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageKey, setStageKey] = useState('rings');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comments>({});

  const mower = useMowersStore((s) => s.mowers[s.selected]);

  // connection lifecycle
  useEffect(() => {
    const c = new PlannerClient(wsUrl, prefix, setStatus);
    clientRef.current = c;
    return () => c.end();
  }, [wsUrl, prefix]);

  // persist comments
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMMENTS_KEY);
      if (raw) setComments(JSON.parse(raw));
    } catch {}
  }, []);
  const setComment = (id: string, text: string) =>
    setComments((prev) => {
      const next = {...prev, [id]: text};
      try {
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

  // seed panel params when picking an example / import
  const loadSpecSource = (spec: PlannerSpec, label: string) => {
    setSource({kind: 'spec', spec, label});
    setParams((p) => ({...p, ...spec.params}));
  };

  const onImport = async (file: File) => {
    setError(null);
    try {
      const json = JSON.parse(await file.text());
      if (json && Array.isArray(json.areas)) {
        const map = mapSchema.parse(json);
        const choices = mowAreas(map);
        if (!choices.length) throw new Error('map has no mow areas');
        setSource({kind: 'map', map, activeId: choices[0].id,
          label: `${file.name}`});
      } else {
        const {spec, label} = specFromImport(json, params);
        loadSpecSource(spec, label);
      }
    } catch (e) {
      setError('import failed: ' + (e as Error).message);
    }
  };

  const buildRunSpec = (): PlannerSpec => {
    if (source.kind === 'map') return buildSpecFromMap(source.map, source.activeId, params);
    return {...source.spec, params};
  };

  const run = async () => {
    if (!clientRef.current) return;
    setRunning(true);
    setError(null);
    setSelectedId(null);
    try {
      const res = await clientRef.current.planCoverage(buildRunSpec());
      setPayload(res);
      setStageKey(res.stages[0]?.key ?? 'rings');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const mowerChoices = useMemo(
    () => (mower?.map ? mowAreas(mower.map) : []),
    [mower],
  );

  const fmt = (s: number) => (s < 1 ? `${Math.round(s * 1000)} ms` : `${s.toFixed(2)} s`);

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
      {/* header */}
      <Stack direction="row" spacing={2} alignItems="center"
        sx={{p: 1.5, borderBottom: '1px solid #ddd'}}>
        <Typography variant="h6">Planner Studio</Typography>
        <Chip size="small" label={status}
          color={status === 'connected' ? 'success' : 'default'} />
        <Box sx={{flex: 1}} />
        <Button variant="contained" onClick={run} disabled={running || status !== 'connected'}>
          {running ? 'Planning…' : 'Run pipeline'}
        </Button>
        <Button variant="outlined" disabled={!payload}
          onClick={() => payload && download('lineage.json',
            JSON.stringify(fullExport(payload, comments), null, 1), 'application/json')}>
          Export lineage JSON
        </Button>
        <Button variant="outlined" disabled={!payload}
          onClick={() => payload && download('process.md',
            narrative(payload, comments), 'text/markdown')}>
          Export narrative
        </Button>
      </Stack>

      <Box sx={{display: 'flex', flex: 1, minHeight: 0}}>
        {/* left: source + params */}
        <Box sx={{width: 340, p: 2, overflowY: 'auto', borderRight: '1px solid #ddd'}}>
          <Typography variant="subtitle2" gutterBottom>Map source</Typography>
          <TextField select fullWidth size="small" label="Example / source"
            value={source.kind === 'spec' ? source.label : '__map__'}
            onChange={(e) => {
              const ex = EXAMPLES.find((x) => x.name === e.target.value);
              if (ex) loadSpecSource(ex.spec, ex.name);
            }}
            sx={{mb: 1}}>
            {EXAMPLES.map((ex) => (
              <MenuItem key={ex.name} value={ex.name}>{ex.name}</MenuItem>
            ))}
            {source.kind === 'map' && (
              <MenuItem value="__map__">{source.label}</MenuItem>
            )}
          </TextField>

          <Stack direction="row" spacing={1} sx={{mb: 1}}>
            <Button component="label" size="small" variant="outlined">
              Import JSON
              <input hidden type="file" accept="application/json,.json"
                onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
            </Button>
            {mowerChoices.length > 0 && (
              <Button size="small" variant="outlined"
                onClick={() => setSource({kind: 'map', map: mower!.map,
                  activeId: mowerChoices[0].id, label: `${mower!.name} map`})}>
                Use mower map
              </Button>
            )}
          </Stack>

          {source.kind === 'map' && (
            <TextField select fullWidth size="small" label="Mow area to plan"
              value={source.activeId}
              onChange={(e) => setSource({...source, activeId: e.target.value})}
              sx={{mb: 1}}>
              {mowAreas(source.map).map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
          )}

          <Divider sx={{my: 1.5}} />
          <ParamsPanel params={params} onChange={setParams} />

          <Divider sx={{my: 1.5}} />
          <Typography variant="caption" color="text.secondary">Connection</Typography>
          <TextField fullWidth size="small" label="Planner MQTT ws URL" sx={{mt: 1}}
            value={wsUrl} onChange={(e) => setWsUrl(e.target.value)} />
          <TextField fullWidth size="small" label="Topic prefix" sx={{mt: 1}}
            value={prefix} onChange={(e) => setPrefix(e.target.value)} />
        </Box>

        {/* center: stages + viewer */}
        <Box sx={{flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0}}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {payload && (
            <>
              <Stack direction="row" spacing={1} alignItems="center"
                sx={{px: 1, pt: 1}}>
                {payload.report.hard.length > 0 ? (
                  <Chip size="small" color="error"
                    label={`${payload.report.hard.length} HARD`} />
                ) : (
                  <Chip size="small" color="success" label="valid" />
                )}
                {payload.report.soft.length > 0 && (
                  <Chip size="small" color="warning"
                    label={`${payload.report.soft.length} soft`} />
                )}
                <Typography variant="caption" color="text.secondary">
                  angle {payload.angle_deg}° · total {fmt(payload.stats.plan_time_s ?? 0)}
                  {payload.stats.double_mowed_pct != null &&
                    ` · double-mow ${payload.stats.double_mowed_pct}%`}
                </Typography>
              </Stack>
              <Tabs value={stageKey} onChange={(_, v) => {setStageKey(v); setSelectedId(null);}}
                variant="scrollable" scrollButtons="auto">
                {payload.stages.map((s) => (
                  <Tab key={s.key} value={s.key}
                    label={`${s.n}. ${s.name} · ${fmt(s.time_s)} · ${s.ids.length}`} />
                ))}
              </Tabs>
            </>
          )}
          <Box sx={{flex: 1, minHeight: 0}}>
            {payload ? (
              <StageViewer payload={payload} stageKey={stageKey}
                selectedId={selectedId} onSelect={setSelectedId} comments={comments} />
            ) : (
              <Box sx={{p: 4, color: 'text.secondary'}}>
                <Typography>Pick a source and press <b>Run pipeline</b>.</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* right: inspector */}
        <Box sx={{width: 380, borderLeft: '1px solid #ddd', minHeight: 0}}>
          {payload && (
            <Inspector payload={payload} selectedId={selectedId} comments={comments}
              onComment={setComment} onSelect={setSelectedId}
              onExportSummary={(id) =>
                download(`summary-${id}.md`, objectSummary(payload, id, comments),
                  'text/markdown')} />
          )}
        </Box>
      </Box>
    </Box>
  );
}
