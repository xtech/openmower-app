import { useSelectedMower } from '@/stores/mowersStore';
import type { TrackAttributes } from '@/stores/schemas';
import type { TrackSegment } from '@/utils/track-pipeline';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface PastTrack {
  jobId: string;
  segments: TrackSegment[];
}

export type JobTrackState =
  | { status: 'live' }
  | { status: 'loading' }
  | { status: 'loaded'; pastTrack: PastTrack }
  | { status: 'error'; jobId: string };

/**
 * Fetches and caches historical track data for a selected job.
 *
 * Returns null when selectedJobId is null or matches the current live job,
 * so callers can fall through to the live pipeline.
 */
export function useJobTrack(selectedJobId: string | null): {
  pastTrack: PastTrack | null;
  loading: boolean;
} {
  const rpc = useSelectedMower((s) => s?.rpc);
  const liveJobId = useSelectedMower((s) => s?.track.attributes.job_id ?? null);

  // Cache past tracks by job_id to avoid re-fetching
  const cache = useRef<Map<string, PastTrack>>(new Map());

  const [state, setState] = useState<JobTrackState>({ status: 'live' });

  const isHistoricalJob = selectedJobId !== null && selectedJobId !== liveJobId;

  const fetchJob = useCallback(
    async (jobId: string) => {
      if (!rpc) return;

      const cached = cache.current.get(jobId);
      if (cached) {
        setState({ status: 'loaded', pastTrack: cached });
        return;
      }

      setState({ status: 'loading' });
      try {
        const result = await rpc.position.history({ job_id: jobId });
        const segments: TrackSegment[] = (
          (result.segments ?? []) as {
            attributes: TrackAttributes;
            points: [number, number][];
          }[]
        ).map((seg) => ({
          attributes: seg.attributes as TrackAttributes,
          points: seg.points.map(([x, y]) => ({ x, y })),
        }));
        const pastTrack: PastTrack = { jobId, segments };
        cache.current.set(jobId, pastTrack);
        setState({ status: 'loaded', pastTrack });
      } catch {
        setState({ status: 'error', jobId });
      }
    },
    [rpc],
  );

  useEffect(() => {
    if (!isHistoricalJob) {
      setState({ status: 'live' });
      return;
    }
    void fetchJob(selectedJobId);
  }, [isHistoricalJob, selectedJobId, fetchJob]);

  if (!isHistoricalJob) {
    return { pastTrack: null, loading: false };
  }

  if (state.status === 'loaded' && state.pastTrack.jobId === selectedJobId) {
    return { pastTrack: state.pastTrack, loading: false };
  }

  // Either explicitly loading, or state belongs to a different job (stale)
  return { pastTrack: null, loading: true };
}
