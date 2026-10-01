'use client';

import { Box } from '@mui/material';
import { Rabbit, Turtle } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface SpeedLeverProps {
  value: number; // 0 (slow), 1 (medium), 2 (fast)
  onChange: (val: number) => void;
  simulatorMode?: boolean;
}

const TRACK_HEIGHT = 150;
const TRACK_WIDTH = 48;
const KNOB_SIZE = 40;
const BORDER_W = 2;
const PAD = 2;
const MAX_TRAVEL = TRACK_HEIGHT - BORDER_W * 2 - PAD * 2 - KNOB_SIZE;

const Icons = ({ color }: { color: string }) => (
  <>
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 12,
        height: 2,
        borderRadius: 1,
        background: color,
      }}
    />
    <Rabbit
      size={20}
      color={color}
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    />
    <Turtle
      size={20}
      color={color}
      style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    />
  </>
);

export default function SpeedLever({ value, onChange, simulatorMode = false }: SpeedLeverProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<number>(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (pointerIdRef.current !== null) return;
      if (!trackRef.current) return;

      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      pointerIdRef.current = e.pointerId;

      const rect = trackRef.current.getBoundingClientRect();
      const pointerY = e.clientY - rect.top - BORDER_W - PAD;

      // We use value to determine the current visual position if not dragging
      const currentVisualY = value === 2 ? 0 : value === 1 ? MAX_TRAVEL / 2 : MAX_TRAVEL;
      const knobTop = currentVisualY;
      const knobBottom = currentVisualY + KNOB_SIZE;

      if (pointerY >= knobTop && pointerY <= knobBottom) {
        // Clicked on the knob -> start dragging
        setIsDragging(true);
        dragOffsetRef.current = pointerY - currentVisualY;
        setDragY(currentVisualY);
      } else {
        // Clicked on the track -> update state and let CSS animate
        setIsDragging(false);
        const targetY = Math.max(0, Math.min(MAX_TRAVEL, pointerY - KNOB_SIZE / 2));
        const frac = targetY / MAX_TRAVEL;
        let state = 1;
        if (frac < 0.25) state = 2;
        else if (frac > 0.75) state = 0;
        onChange(state);
      }
    },
    [value, onChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId !== pointerIdRef.current || !isDragging) return;
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const pointerY = e.clientY - rect.top - BORDER_W - PAD;

      let y = pointerY - dragOffsetRef.current;
      y = Math.max(0, Math.min(MAX_TRAVEL, y));
      setDragY(y);

      const frac = y / MAX_TRAVEL;
      let state = 1;
      if (frac < 0.25) state = 2;
      else if (frac > 0.75) state = 0;
      onChange(state);
    },
    [isDragging, onChange],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== pointerIdRef.current) return;
    pointerIdRef.current = null;
    setIsDragging(false);
    setDragY(null);
  }, []);

  const currentY = isDragging && dragY !== null ? dragY : value === 2 ? 0 : value === 1 ? MAX_TRAVEL / 2 : MAX_TRAVEL;

  // The springy transition is used when NOT dragging
  const transitionStyle = isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.34, 1.25, 0.64, 1)';

  return (
    <Box
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      sx={{
        width: TRACK_WIDTH,
        height: TRACK_HEIGHT,
        borderRadius: 24,
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        background: simulatorMode
          ? 'radial-gradient(circle, rgba(180,0,0,0.35) 0%, rgba(120,0,0,0.5) 100%)'
          : 'radial-gradient(circle, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.4) 100%)',
        border: simulatorMode ? `${BORDER_W}px solid rgba(255,80,80,0.5)` : `${BORDER_W}px solid rgba(255,255,255,0.3)`,
        backdropFilter: 'blur(4px)',
        boxSizing: 'border-box',
      }}
    >
      {/* Base layer: White icons on the dark track */}
      <Icons color="rgba(255,255,255,0.6)" />

      {/* Knob Container */}
      <Box
        sx={{
          position: 'absolute',
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          left: PAD,
          top: PAD,
          transform: `translateY(${currentY}px)`,
          transition: transitionStyle,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {/* Knob Background & Border */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: isDragging
              ? 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)'
              : 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.5) 100%)',
            border: '2px solid rgba(255,255,255,0.8)',
            transition: 'background 0.2s',
            boxSizing: 'border-box',
          }}
        />

        {/* Clipping mask for icons */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            overflow: 'hidden',
            // Fix Safari overflow: hidden with border-radius bug
            transform: 'translateZ(0)',
          }}
        >
          {/* Inner container that moves in the opposite direction of the knob to stay fixed relative to the track */}
          <Box
            sx={{
              position: 'absolute',
              top: -PAD,
              left: -PAD,
              width: TRACK_WIDTH - BORDER_W * 2,
              height: TRACK_HEIGHT - BORDER_W * 2,
              transform: `translateY(${-currentY}px)`,
              transition: transitionStyle,
            }}
          >
            {/* Top layer: Dark icons, visible only where the clipping mask allows */}
            <Icons color="rgba(0,0,0,0.7)" />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
