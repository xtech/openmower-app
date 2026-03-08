'use client';

import {ChevronRight as ChevronRightIcon} from '@mui/icons-material';
import {Box, Typography} from '@mui/material';
import {Fragment, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

export function StickyBreadcrumb() {
  const [crumbs, setCrumbs] = useState<string[]>([]);
  const [rect, setRect] = useState<{top: number; left: number; width: number} | null>(null);
  const [slideOffset, setSlideOffset] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = document.querySelector('main');
    if (!scrollContainer) return;

    let rafId: number;

    function update() {
      const containerRect = scrollContainer!.getBoundingClientRect();
      setRect({top: containerRect.top, left: containerRect.left, width: containerRect.width});

      const markers = document.querySelectorAll<HTMLElement>('[data-section-marker]');
      const barHeight = barRef.current?.getBoundingClientRect().height ?? 0;
      const containerTop = containerRect.top;

      // Find the first marker within the slide window [containerTop + barHeight*2 .. already past].
      // We need to look ahead (marker still below containerTop) because the slide starts before it crosses.
      let firstRelevantMarker: HTMLElement | null = null;
      for (const marker of markers) {
        if (marker.closest('.MuiCollapse-hidden')) continue;
        const markerTop = marker.getBoundingClientRect().top;
        if (markerTop <= containerTop + barHeight * 2) {
          firstRelevantMarker = marker;
          break;
        }
      }

      let offset = 0;
      if (firstRelevantMarker && barHeight > 0) {
        const markerTop = firstRelevantMarker.getBoundingClientRect().top;
        // traveled: 0 when marker is at containerTop + barHeight*2 (hidden), barHeight when at containerTop + barHeight (fully visible).
        const traveled = Math.min(Math.max(containerTop + barHeight * 2 - markerTop, 0), barHeight);
        offset = traveled / barHeight;
      }
      setSlideOffset(offset);

      const threshold = containerTop + barHeight;
      const active = new Map<number, {label: string; marker: HTMLElement}>();

      for (const marker of markers) {
        if (marker.closest('.MuiCollapse-hidden')) continue;
        const markerRect = marker.getBoundingClientRect();
        if (markerRect.top > threshold) continue;

        const level = Number(marker.dataset.sectionLevel);
        const label = marker.dataset.sectionLabel!;

        active.set(level, {label, marker});
        for (const key of active.keys()) {
          if (key > level) active.delete(key);
        }
      }

      // Remove levels whose accordion section has scrolled fully past the threshold.
      // If a same-level sibling follows, extend the active region all the way to that sibling's marker
      // top — so the crumb stays until the moment the next header takes over, with no gap.
      // If no sibling follows, pop as soon as the collapse bottom passes the threshold.
      for (const [level, {marker}] of active) {
        const accordion = marker.closest('.MuiAccordion-root');
        const collapse = accordion?.querySelector(':scope > .MuiCollapse-root');
        if (!collapse) continue;
        if (collapse.getBoundingClientRect().bottom >= threshold) continue;

        const nextAccordion = accordion?.nextElementSibling?.closest('.MuiAccordion-root') ?? accordion?.nextElementSibling;
        const nextMarker = nextAccordion?.querySelector<HTMLElement>(`[data-section-marker][data-section-level="${level}"]`);
        if (nextMarker && nextMarker.getBoundingClientRect().top > threshold) {
          // Gap between sections — keep current crumb until next marker crosses.
          continue;
        }

        active.delete(level);
      }

      const result = [...active.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, {label}]) => label);

      setCrumbs((prev) => {
        if (prev.length === result.length && prev.every((v, i) => v === result[i])) return prev;
        return result;
      });
    }

    function onScroll() {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    }

    scrollContainer.addEventListener('scroll', onScroll, {passive: true});
    update();

    return () => {
      scrollContainer.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!rect) return null;

  return createPortal(
    <Box
      ref={barRef}
      sx={{
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 2,
        py: 0.75,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        opacity: slideOffset,
        transform: `translateY(${(slideOffset - 1) * 100}%)`,
        pointerEvents: slideOffset > 0 ? 'auto' : 'none',
      }}
    >
      {crumbs.length === 0 && <Typography variant="caption">&nbsp;</Typography>}
      {crumbs.map((label, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRightIcon sx={{fontSize: 16, color: 'text.disabled', flexShrink: 0}} />}
          <Typography
            variant="caption"
            noWrap
            sx={{
              fontWeight: i === crumbs.length - 1 ? 600 : 400,
              color: i === crumbs.length - 1 ? 'text.primary' : 'text.secondary',
            }}
          >
            {label}
          </Typography>
        </Fragment>
      ))}
    </Box>,
    document.body,
  );
}
