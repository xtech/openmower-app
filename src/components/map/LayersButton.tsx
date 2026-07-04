'use client';

import {useMapDisplayStore} from '@/stores/mapDisplayStore';
import {useSelectedMower} from '@/stores/mowersStore';
import type {Datum} from '@/stores/schemas';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Skeleton from '@mui/material/Skeleton';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {ChevronLeftIcon, ChevronRightIcon, ClockIcon, LayersIcon, RotateCcwIcon} from 'lucide-react';
import {useRControl} from 'maplibre-react-components';
import {useRef, useState} from 'react';
import {createPortal} from 'react-dom';

interface LayersButtonProps {
  datum: Datum | null;
  trackLoading?: boolean;
  editMode?: boolean;
}

export default function LayersButton({datum, trackLoading, editMode}: LayersButtonProps) {
  const {container} = useRControl({position: 'top-right'});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const {
    showSatelliteLayer,
    showTrackLayer,
    showPlannedPath,
    selectedJobId,
    setShowSatelliteLayer,
    setShowTrackLayer,
    setShowPlannedPath,
    setSelectedJobId,
  } = useMapDisplayStore();

  const hasPositionCapability = useSelectedMower((s) => s?.hasCapability('position') ?? false);
  const jobList = useSelectedMower((s) => s?.jobList ?? null);
  const liveJobId = useSelectedMower((s) => s?.track.attributes.job_id ?? null);

  const jobListLoaded = jobList !== null;
  // Exclude the live job — it's represented by "Current" (server returns newest first)
  const pastJobs = (jobList ?? []).filter((j) => j.job_id !== liveJobId);

  // All selectable entries: index 0 = "Current (live)", then historical jobs newest-first
  const allEntries: Array<{id: string | null; label: string}> = [
    {id: null, label: 'Current'},
    ...pastJobs.map((job) => {
      const date = new Date(job.epoch * 1000);
      const label = Number.isNaN(date.getTime())
        ? 'Unknown date'
        : date.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
      return {id: job.job_id, label};
    }),
  ];

  const activeIdx = allEntries.findIndex((e) => e.id === selectedJobId);
  const currentIdx = activeIdx === -1 ? 0 : activeIdx;
  const currentEntry = allEntries[currentIdx];

  const isViewingHistory = selectedJobId !== null && selectedJobId !== liveJobId;

  const handleJobSelect = (jobId: string | null) => {
    setSelectedJobId(jobId);
  };

  const stepJob = (dir: -1 | 1) => {
    const next = currentIdx + dir;
    if (next >= 0 && next < allEntries.length) {
      handleJobSelect(allEntries[next].id);
    }
  };

  const content = (
    <>
      <button
        ref={buttonRef}
        type="button"
        title="Layers"
        onClick={() => setOpen((o) => !o)}
        style={{padding: 0, position: 'relative'}}
      >
        <LayersIcon />
        {hasPositionCapability && isViewingHistory && !editMode && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#f97316',
            }}
          >
            <ClockIcon size={12} color="white" strokeWidth={2.5} />
          </span>
        )}
      </button>

      <Popover
        open={open}
        anchorEl={buttonRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{vertical: 'top', horizontal: 'left'}}
        transformOrigin={{vertical: 'top', horizontal: 'right'}}
        slotProps={{paper: {sx: {minWidth: 220, p: 1}}}}
      >
        <Typography variant="overline" sx={{px: 1, display: 'block', lineHeight: 2}}>
          Layers
        </Typography>

        <FormControlLabel
          sx={{mx: 0, px: 1, py: 0.5, width: '100%'}}
          control={
            <Switch
              checked={showSatelliteLayer}
              onChange={(e) => setShowSatelliteLayer(e.target.checked)}
              disabled={!datum}
            />
          }
          label="Satellite"
        />

        <FormControlLabel
          sx={{mx: 0, px: 1, py: 0.5, width: '100%'}}
          control={
            <Switch
              checked={showPlannedPath && !editMode}
              onChange={(e) => setShowPlannedPath(e.target.checked)}
              disabled={editMode}
            />
          }
          label="Planned path"
        />

        {hasPositionCapability && (
          <>
            <FormControlLabel
              sx={{mx: 0, px: 1, py: 0.5, width: '100%'}}
              control={
                <Switch
                  checked={showTrackLayer && !editMode}
                  onChange={(e) => setShowTrackLayer(e.target.checked)}
                  disabled={editMode}
                />
              }
              label={
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                  Driven track
                  <CircularProgress size={12} sx={{visibility: trackLoading ? 'visible' : 'hidden'}} />
                </Box>
              }
            />

            {showTrackLayer && !editMode && (
              <Box sx={{display: 'flex', alignItems: 'center', px: 1}}>
                <Tooltip title="Previous job">
                  <span>
                    <IconButton
                      onClick={() => stepJob(1)}
                      disabled={!jobListLoaded || currentIdx === allEntries.length - 1}
                    >
                      <ChevronLeftIcon size={18} />
                    </IconButton>
                  </span>
                </Tooltip>

                <Box
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    cursor: 'default',
                    userSelect: 'none',
                    minWidth: 0,
                  }}
                >
                  {!jobListLoaded && selectedJobId !== null ? (
                    <Skeleton variant="text" width="80%" sx={{mx: 'auto'}} />
                  ) : (
                    <Typography
                      variant="body2"
                      noWrap
                      fontWeight={500}
                      sx={{opacity: trackLoading ? 0.4 : 1, transition: 'opacity 0.15s'}}
                    >
                      {currentEntry.label}
                    </Typography>
                  )}
                </Box>

                <Tooltip title="Next job">
                  <span>
                    <IconButton onClick={() => stepJob(-1)} disabled={!jobListLoaded || currentIdx === 0}>
                      <ChevronRightIcon size={18} />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Back to current">
                  <span>
                    <IconButton size="small" onClick={() => handleJobSelect(null)} disabled={!isViewingHistory}>
                      <RotateCcwIcon size={16} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            )}
          </>
        )}
      </Popover>
    </>
  );

  return createPortal(content, container);
}
