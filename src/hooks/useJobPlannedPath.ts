import {useSelectedMower} from '@/stores/mowersStore';
import {plannedPathSchema, type PlannedPath} from '@/stores/schemas';
import {useCallback, useEffect, useRef, useState} from 'react';

type FetchState =
  | {status: 'idle'}
  | {status: 'loading'; jobId: string}
  | {status: 'loaded'; jobId: string; planned: PlannedPath | null}
  | {status: 'error'; jobId: string};

/**
 * Fetches a job's whole planned path from history (one area at a time) and assembles it client-side.
 *
 * Used for BOTH a selected past job AND the current/live job: the live MQTT topic is only a
 * {job_id, step_index} signal, so the plan is fetched and held client-side and therefore stays
 * visible after the job is cancelled/finished, exactly like the driven track. The signal picks the
 * current job and triggers a re-fetch when a new area is planned (step_index advances).
 */
export function useJobPlannedPath(selectedJobId: string | null): {plannedPath: PlannedPath | null; loading: boolean} {
  const rpc = useSelectedMower((s) => s?.rpc);
  const liveJobId = useSelectedMower((s) => s?.plannedPathSignal?.job_id ?? null);
  const liveStep = useSelectedMower((s) => s?.plannedPathSignal?.step_index ?? null);

  // The job to display: an explicitly selected past job, else the current/live job.
  const jobId = selectedJobId ?? liveJobId;
  const isLive = jobId !== null && jobId === liveJobId;

  // Cache assembled plans by job_id. Past jobs are immutable; the live job grows as it mows, so it
  // is always re-fetched (its cache entry is overwritten each time).
  const cache = useRef<Map<string, PlannedPath | null>>(new Map());
  const latestJobId = useRef<string | null>(null);
  const [state, setState] = useState<FetchState>({status: 'idle'});

  const fetchJob = useCallback(
    async (id: string, useCache: boolean) => {
      if (!rpc) return;
      latestJobId.current = id;

      if (useCache) {
        const cached = cache.current.get(id);
        if (cached !== undefined) {
          setState({status: 'loaded', jobId: id, planned: cached});
          return;
        }
      }

      // Only show a spinner if we have nothing to display for this job yet; a live-job re-fetch keeps
      // the current plan on screen (no flicker) until the grown plan arrives.
      setState((prev) => (prev.status === 'loaded' && prev.jobId === id ? prev : {status: 'loading', jobId: id}));
      try {
        // Fetch the job's step list (metadata only), then each area's geometry separately so no single
        // MQTT message carries the whole job. Fetch in small batches and do NOT swallow a real failure
        // (timeout / transport) -- that fails the load rather than rendering a partial path. A
        // genuinely empty/missing step resolves to [] (the backend returns it as a result).
        const stepList = await rpc.planned_path.history({job_id: id});
        const stepIndices = (stepList?.steps ?? [])
          .map((s) => s.step_index)
          .filter((i): i is number => typeof i === 'number');

        const batches: unknown[][] = [];
        const BATCH = 6;
        for (let i = 0; i < stepIndices.length; i += BATCH) {
          const batch = await Promise.all(
            stepIndices
              .slice(i, i + BATCH)
              .map((step_index) =>
                rpc.planned_path.history.step({job_id: id, step_index}).then((r) => (r?.paths ?? []) as unknown[]),
              ),
          );
          batches.push(...batch);
        }

        const parsed = plannedPathSchema.safeParse({job_id: id, paths: batches.flat()});
        const planned = parsed.success ? parsed.data : null;
        cache.current.set(id, planned);
        // Ignore the result if a newer job was selected while we were fetching.
        if (latestJobId.current === id) setState({status: 'loaded', jobId: id, planned});
      } catch {
        if (latestJobId.current === id) setState({status: 'error', jobId: id});
      }
    },
    [rpc],
  );

  useEffect(() => {
    if (!jobId) {
      latestJobId.current = null;
      setState({status: 'idle'});
      return;
    }
    // Past jobs are immutable -> use the cache. The live job grows per area -> re-fetch fresh, and
    // re-run whenever its step advances (liveStep is a trigger dependency).
    void fetchJob(jobId, !isLive);
  }, [jobId, isLive, liveStep, fetchJob]);

  if (!jobId) return {plannedPath: null, loading: false};
  if (state.status === 'loaded' && state.jobId === jobId) return {plannedPath: state.planned, loading: false};
  return {plannedPath: null, loading: true};
}
