// Client-side export builders over a PlannerPayload: the full lineage
// JSON with merged comments, a technical process narrative, and a
// per-object summary that walks only the ancestors that influenced a
// given object (dropping unrelated lanes).

import type {Comments, LineageObject, PlannerPayload} from './types';

function objectMap(payload: PlannerPayload): Map<string, LineageObject> {
  const m = new Map<string, LineageObject>();
  for (const o of payload.lineage.objects) m.set(o.id, o);
  return m;
}

// Transitive parents of `id` (breadth-first, stable, excludes `id`).
export function ancestors(payload: PlannerPayload, id: string): string[] {
  const m = objectMap(payload);
  const seen = new Set<string>();
  const q = [id];
  while (q.length) {
    const cur = q.shift()!;
    for (const p of m.get(cur)?.parents ?? []) {
      if (!seen.has(p)) {
        seen.add(p);
        q.push(p);
      }
    }
  }
  return [...seen];
}

function describe(o: LineageObject): string {
  const bits: string[] = [];
  if (o.parents.length) bits.push(`from ${o.parents.join(', ')}`);
  const reason = o.op.reason ? ` — ${o.op.reason}` : '';
  const parens = bits.length ? ` (${bits.join('; ')})` : '';
  return `**${o.id}** [${o.kind}] via \`${o.op.name}\`${parens}${reason}`;
}

// Full technical process description of the whole plan.
export function narrative(payload: PlannerPayload, comments: Comments): string {
  const m = objectMap(payload);
  const lines: string[] = [
    `# Coverage plan — technical process`,
    ``,
    `Angle ${payload.angle_deg}°, ${payload.lineage.objects.length} objects, ` +
      `plan time ${payload.stats.plan_time_s ?? '?'}s. ` +
      `HARD ${payload.report.hard.length}, soft ${payload.report.soft.length}.`,
    ``,
    `## Stages`,
    ...payload.stages.map(
      (s) => `- Stage ${s.n} — ${s.name}: ${s.time_s.toFixed(3)}s, ${s.ids.length} objects`,
    ),
    ``,
    `## Transitions (in order)`,
  ];
  for (const e of payload.lineage.events) {
    const io = `${e.inputs.join(', ') || '∅'} → ${e.outputs.join(', ')}`;
    lines.push(`- \`${e.op}\`: ${io}${e.reason ? ` — ${e.reason}` : ''}`);
  }
  const noted = Object.keys(comments).filter((k) => comments[k]?.trim());
  if (noted.length) {
    lines.push(``, `## Feedback`);
    for (const id of noted) {
      const o = m.get(id);
      lines.push(`- **${id}**${o ? ` [${o.kind}]` : ''}: ${comments[id].trim()}`);
    }
  }
  return lines.join('\n');
}

// Summary of just what influenced `id`: its ancestor sub-DAG + only the
// events whose outputs land in that set, with the merged comment.
export function objectSummary(
  payload: PlannerPayload,
  id: string,
  comments: Comments,
): string {
  const m = objectMap(payload);
  const o = m.get(id);
  if (!o) return `Unknown object ${id}`;
  const ids = new Set<string>([id, ...ancestors(payload, id)]);
  const events = payload.lineage.events.filter((e) =>
    e.outputs.some((x) => ids.has(x)),
  );
  const lines: string[] = [
    `# How ${id} was produced`,
    ``,
    describe(o),
    ``,
    `Meta: \`${JSON.stringify(o.meta)}\``,
  ];
  if (comments[id]?.trim()) lines.push(``, `**Feedback:** ${comments[id].trim()}`);
  lines.push(``, `## Contributing steps (${ids.size} objects)`);
  for (const e of events) {
    const io = `${e.inputs.join(', ') || '∅'} → ${e.outputs.join(', ')}`;
    lines.push(`- \`${e.op}\`: ${io}${e.reason ? ` — ${e.reason}` : ''}`);
  }
  // any comments on contributing objects too
  const related = [...ids].filter((x) => x !== id && comments[x]?.trim());
  if (related.length) {
    lines.push(``, `## Feedback on contributing objects`);
    for (const x of related) lines.push(`- **${x}**: ${comments[x].trim()}`);
  }
  return lines.join('\n');
}

// Full lineage JSON with comments merged onto their objects.
export function fullExport(payload: PlannerPayload, comments: Comments): unknown {
  const objects = payload.lineage.objects.map((o) => ({
    ...o,
    comment: comments[o.id]?.trim() || undefined,
  }));
  return {
    angle_deg: payload.angle_deg,
    params: payload.params,
    stats: payload.stats,
    report: payload.report,
    stages: payload.stages.map(({n, key, name, time_s, ids}) => ({
      n,
      key,
      name,
      time_s,
      count: ids.length,
    })),
    lineage: {objects, events: payload.lineage.events},
  };
}

export function download(filename: string, text: string, mime = 'text/plain') {
  const blob = new Blob([text], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
