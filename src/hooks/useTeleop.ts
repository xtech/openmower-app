import {useMowersStore} from '@/stores/mowersStore';
import {useCallback, useEffect, useRef} from 'react';

const PUBLISH_INTERVAL_MS = 100;

interface UseTeleopOptions {
  /**
   * When true, starts publishing immediately (at 0,0) and keeps publishing
   * even when the stick is centred. When false, only publishes while moving.
   */
  publishAtRest?: boolean;
}

export function useTeleop({publishAtRest = false}: UseTeleopOptions = {}) {
  const vel = useRef({vx: 0, vz: 0});
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const publish = useCallback(() => {
    const {mowers, selected} = useMowersStore.getState();
    mowers[selected]?.publishTeleop(vel.current.vx, vel.current.vz);
  }, []);

  const updatePublishInterval = useCallback(
    (override?: boolean) => {
      const shouldPublish = override ?? (publishAtRest || vel.current.vx !== 0 || vel.current.vz !== 0);
      const isPublishing = interval.current !== null;
      if (shouldPublish && !isPublishing) {
        publish();
        interval.current = setInterval(publish, PUBLISH_INTERVAL_MS);
      } else if (!shouldPublish && isPublishing) {
        clearInterval(interval.current!);
        interval.current = null;
        publish();
      }
    },
    [publishAtRest, publish],
  );

  const setVelocity = useCallback(
    (vx: number, vz: number) => {
      vel.current = {vx: Math.max(-1, Math.min(1, vx)), vz: Math.max(-1, Math.min(1, vz))};
      updatePublishInterval();
    },
    [updatePublishInterval],
  );

  useEffect(() => {
    if (publishAtRest) {
      updatePublishInterval(true);
    }
    return () => {
      updatePublishInterval(false);
    };
  }, []);

  return {setVelocity};
}
