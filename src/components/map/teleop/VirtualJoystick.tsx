'use client';

import { Box } from '@mui/material';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const OUTER_RADIUS = 90;
const KNOB_RADIUS = 25;
const KNOB_HIT_PADDING = 4;
const DPAD_ICON_SIZE = 28;
const DPAD_ICON_INSET = 6;
const DPAD_HIT_PADDING = 6;
const DPAD_HIT_HALF = (DPAD_ICON_SIZE + DPAD_HIT_PADDING) / 2;
const DPAD_CENTER_OFFSET = OUTER_RADIUS - DPAD_ICON_INSET - DPAD_ICON_SIZE / 2;
const DPAD_RAMP_DURATION_MS = 500;
const ANGULAR_FACTOR = 1.6;

type DpadDirection = 'up' | 'down' | 'left' | 'right' | null;

const DPAD_HIT_CENTERS: Record<Exclude<DpadDirection, null>, { x: number; y: number }> = {
  up: { x: 0, y: -DPAD_CENTER_OFFSET },
  down: { x: 0, y: DPAD_CENTER_OFFSET },
  left: { x: -DPAD_CENTER_OFFSET, y: 0 },
  right: { x: DPAD_CENTER_OFFSET, y: 0 },
};

interface VirtualJoystickProps {
  onVelocityChange: (vx: number, vz: number) => void;
  simulatorMode?: boolean;
}

export default function VirtualJoystick({ onVelocityChange, simulatorMode = false }: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [hoverKnob, setHoverKnob] = useState(false);
  const [hoverDpad, setHoverDpad] = useState<DpadDirection>(null);
  const [activeDpad, setActiveDpad] = useState<DpadDirection>(null);
  const dpadStartTime = useRef<number>(0);
  const dpadRafRef = useRef<number>(0);
  const pointerIdRef = useRef<number | null>(null);

  const getJoystickOffset = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return { dx: clientX - cx, dy: clientY - cy };
  }, []);

  const isKnobHit = useCallback(
    (clientX: number, clientY: number) => {
      const offset = getJoystickOffset(clientX, clientY);
      if (!offset) return false;
      const dist = Math.hypot(offset.dx - knobPos.x, offset.dy - knobPos.y);
      return dist <= KNOB_RADIUS + KNOB_HIT_PADDING;
    },
    [getJoystickOffset, knobPos],
  );

  const getDpadDirection = useCallback(
    (clientX: number, clientY: number): DpadDirection => {
      if (isKnobHit(clientX, clientY)) return null;
      const offset = getJoystickOffset(clientX, clientY);
      if (!offset) return null;
      const { dx, dy } = offset;

      for (const dir of ['up', 'down', 'left', 'right'] as const) {
        const center = DPAD_HIT_CENTERS[dir];
        if (Math.abs(dx - center.x) <= DPAD_HIT_HALF && Math.abs(dy - center.y) <= DPAD_HIT_HALF) {
          return dir;
        }
      }
      return null;
    },
    [getJoystickOffset, isKnobHit],
  );

  const dpadToVelocity = useCallback((dir: DpadDirection, elapsed: number): { vx: number; vz: number } => {
    if (!dir) return { vx: 0, vz: 0 };
    const t = Math.min(elapsed / DPAD_RAMP_DURATION_MS, 1);
    switch (dir) {
      case 'up':
        return { vx: t, vz: 0 };
      case 'down':
        return { vx: -t, vz: 0 };
      case 'left':
        return { vx: 0, vz: t * ANGULAR_FACTOR };
      case 'right':
        return { vx: 0, vz: -t * ANGULAR_FACTOR };
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
      const { vx, vz } = dpadToVelocity(activeDpad, elapsed);
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
      } else if (isKnobHit(e.clientX, e.clientY)) {
        setDragging(true);
      }
    },
    [getDpadDirection, isKnobHit],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (pointerIdRef.current === null) {
        const knob = isKnobHit(e.clientX, e.clientY);
        setHoverKnob(knob);
        setHoverDpad(knob ? null : getDpadDirection(e.clientX, e.clientY));
        return;
      }
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

      setKnobPos({ x: dx, y: dy });

      const vx = -(dy / maxDist);
      const vz = -(dx / maxDist) * ANGULAR_FACTOR;
      onVelocityChange(vx, vz);
    },
    [dragging, getDpadDirection, isKnobHit, onVelocityChange],
  );

  const handlePointerLeave = useCallback(() => {
    setHoverKnob(false);
    setHoverDpad(null);
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== pointerIdRef.current) return;
      pointerIdRef.current = null;
      setDragging(false);
      setKnobPos({ x: 0, y: 0 });
      setActiveDpad(null);
      onVelocityChange(0, 0);
    },
    [onVelocityChange],
  );

  const size = OUTER_RADIUS * 2;

  return (
    <Box
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
        cursor: dragging ? 'grabbing' : hoverKnob ? 'grab' : hoverDpad || activeDpad ? 'pointer' : 'default',
        background: simulatorMode
          ? 'radial-gradient(circle, rgba(180,0,0,0.35) 0%, rgba(120,0,0,0.5) 100%)'
          : 'radial-gradient(circle, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.4) 100%)',
        border: simulatorMode ? '2px solid rgba(255,80,80,0.5)' : '2px solid rgba(255,255,255,0.3)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* D-pad arrows */}
      {(
        [
          { dir: 'up', Icon: ChevronUp, top: DPAD_ICON_INSET, left: '50%', transform: 'translateX(-50%)' },
          { dir: 'down', Icon: ChevronDown, bottom: DPAD_ICON_INSET, left: '50%', transform: 'translateX(-50%)' },
          { dir: 'left', Icon: ChevronLeft, left: DPAD_ICON_INSET, top: '50%', transform: 'translateY(-50%)' },
          { dir: 'right', Icon: ChevronRight, right: DPAD_ICON_INSET, top: '50%', transform: 'translateY(-50%)' },
        ] as const
      ).map(({ dir, Icon, ...pos }) => (
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
          <Icon size={DPAD_ICON_SIZE} />
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
