'use client';

import {Box} from '@mui/material';
import {ChevronDown, ChevronLeft, ChevronRight, ChevronUp} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from 'react';

const OUTER_RADIUS = 90;
const KNOB_RADIUS = 25;
const DEAD_ZONE = 8;
const DPAD_ZONE_START = 0.55;
const DPAD_RAMP_DURATION_MS = 1500;
const ANGULAR_FACTOR = 1.6;

type DpadDirection = 'up' | 'down' | 'left' | 'right' | null;

interface VirtualJoystickProps {
  onVelocityChange: (vx: number, vz: number) => void;
}

export default function VirtualJoystick({onVelocityChange}: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({x: 0, y: 0});
  const [dragging, setDragging] = useState(false);
  const [activeDpad, setActiveDpad] = useState<DpadDirection>(null);
  const dpadStartTime = useRef<number>(0);
  const dpadRafRef = useRef<number>(0);
  const pointerIdRef = useRef<number | null>(null);

  const getDpadDirection = useCallback((clientX: number, clientY: number): DpadDirection => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const normalizedDist = dist / OUTER_RADIUS;

    if (normalizedDist < DPAD_ZONE_START) return null;

    const angle = Math.atan2(dy, dx);
    if (angle > -Math.PI / 4 && angle <= Math.PI / 4) return 'right';
    if (angle > Math.PI / 4 && angle <= (3 * Math.PI) / 4) return 'down';
    if (angle > -(3 * Math.PI) / 4 && angle <= -Math.PI / 4) return 'up';
    return 'left';
  }, []);

  const dpadToVelocity = useCallback((dir: DpadDirection, elapsed: number): {vx: number; vz: number} => {
    if (!dir) return {vx: 0, vz: 0};
    const t = Math.min(elapsed / DPAD_RAMP_DURATION_MS, 1);
    switch (dir) {
      case 'up':
        return {vx: t, vz: 0};
      case 'down':
        return {vx: -t, vz: 0};
      case 'left':
        return {vx: 0, vz: t * ANGULAR_FACTOR};
      case 'right':
        return {vx: 0, vz: -t * ANGULAR_FACTOR};
    }
  }, []);

  useEffect(() => {
    if (!activeDpad) {
      cancelAnimationFrame(dpadRafRef.current);
      return;
    }
    dpadStartTime.current = performance.now();
    const tick = () => {
      const elapsed = performance.now() - dpadStartTime.current;
      const {vx, vz} = dpadToVelocity(activeDpad, elapsed);
      onVelocityChange(vx, vz);
      dpadRafRef.current = requestAnimationFrame(tick);
    };
    dpadRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(dpadRafRef.current);
  }, [activeDpad, dpadToVelocity, onVelocityChange]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (pointerIdRef.current !== null) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      pointerIdRef.current = e.pointerId;

      const dir = getDpadDirection(e.clientX, e.clientY);
      if (dir) {
        setActiveDpad(dir);
      } else {
        setDragging(true);
      }
    },
    [getDpadDirection],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== pointerIdRef.current || !dragging) return;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = OUTER_RADIUS - KNOB_RADIUS;

      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }

      setKnobPos({x: dx, y: dy});

      const normalizedDist = Math.min(dist, maxDist) / maxDist;
      if (normalizedDist * maxDist < DEAD_ZONE) {
        onVelocityChange(0, 0);
      } else {
        const vx = -(dy / maxDist);
        const vz = -(dx / maxDist) * ANGULAR_FACTOR;
        onVelocityChange(vx, vz);
      }
    },
    [dragging, onVelocityChange],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== pointerIdRef.current) return;
      pointerIdRef.current = null;
      setDragging(false);
      setKnobPos({x: 0, y: 0});
      setActiveDpad(null);
      onVelocityChange(0, 0);
    },
    [onVelocityChange],
  );

  const size = OUTER_RADIUS * 2;
  const dpadIconSize = 28;

  return (
    <Box
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
        background: 'radial-gradient(circle, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.4) 100%)',
        border: '2px solid rgba(255,255,255,0.3)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* D-pad arrows */}
      {([
        {dir: 'up', Icon: ChevronUp, top: 6, left: '50%', transform: 'translateX(-50%)'},
        {dir: 'down', Icon: ChevronDown, bottom: 6, left: '50%', transform: 'translateX(-50%)'},
        {dir: 'left', Icon: ChevronLeft, left: 6, top: '50%', transform: 'translateY(-50%)'},
        {dir: 'right', Icon: ChevronRight, right: 6, top: '50%', transform: 'translateY(-50%)'},
      ] as const).map(({dir, Icon, ...pos}) => (
        <Box
          key={dir}
          sx={{
            position: 'absolute',
            ...pos,
            color: activeDpad === dir ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.5)',
            transition: 'color 0.1s',
            pointerEvents: 'none',
          }}
        >
          <Icon size={dpadIconSize} />
        </Box>
      ))}

      {/* Center knob */}
      <Box
        sx={{
          position: 'absolute',
          width: KNOB_RADIUS * 2,
          height: KNOB_RADIUS * 2,
          borderRadius: '50%',
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
          background: dragging
            ? 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)'
            : 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
          border: '2px solid rgba(255,255,255,0.6)',
          transition: dragging ? 'none' : 'transform 0.15s ease-out',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}
