'use client';

import { getTodayDateKey, parseDateKey } from '@/stores/mowerEvents';
import {
  CalendarMonth as CalendarIcon,
  ChevronRight as NextMonthIcon,
  ChevronLeft as PrevMonthIcon,
} from '@mui/icons-material';
import { Box, IconButton, Popover, Typography, useTheme } from '@mui/material';
import { useMemo, useState } from 'react';

interface EventDatePickerProps {
  selectedDate: string;
  availableDates: string[];
  onSelect: (date: string) => void;
}

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1, 12);
}

function getMonthWeeks(viewMonth: Date): (Date | null)[][] {
  const first = startOfMonth(viewMonth);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index + 1, 12),
    ),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (Date | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export default function EventDatePicker({ selectedDate, availableDates, onSelect }: EventDatePickerProps) {
  const theme = useTheme();
  const today = getTodayDateKey();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [viewMonth, setViewMonth] = useState(() => parseDateKey(selectedDate));

  const selectableDates = useMemo(() => new Set([today, ...availableDates]), [today, availableDates]);
  const weeks = useMemo(() => getMonthWeeks(viewMonth), [viewMonth]);
  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setViewMonth(parseDateKey(selectedDate));
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (date: Date) => {
    const dateKey = toDateKey(date);
    if (!selectableDates.has(dateKey)) {
      return;
    }
    onSelect(dateKey);
    handleClose();
  };

  return (
    <>
      <IconButton aria-label="Pick date" onClick={handleOpen} size="small">
        <CalendarIcon />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { sx: { p: 1.5, width: 280 } },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton
            aria-label="Previous month"
            size="small"
            onClick={() => setViewMonth((month) => addMonths(month, -1))}
          >
            <PrevMonthIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {monthLabel}
          </Typography>
          <IconButton aria-label="Next month" size="small" onClick={() => setViewMonth((month) => addMonths(month, 1))}>
            <NextMonthIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25, mb: 0.5 }}>
          {WEEKDAY_LABELS.map((label) => (
            <Typography
              key={label}
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: 'center', fontWeight: 600, py: 0.25 }}
            >
              {label}
            </Typography>
          ))}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {weeks.map((week, weekIndex) => (
            <Box key={weekIndex} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25 }}>
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <Box key={dayIndex} sx={{ width: 32, height: 32 }} />;
                }

                const dateKey = toDateKey(day);
                const selectable = selectableDates.has(dateKey);
                const isSelected = dateKey === selectedDate;
                const isToday = dateKey === today;

                return (
                  <Box
                    key={dayIndex}
                    component="button"
                    type="button"
                    disabled={!selectable}
                    onClick={() => handleSelect(day)}
                    sx={{
                      width: 32,
                      height: 32,
                      border: 'none',
                      borderRadius: 1,
                      p: 0,
                      cursor: selectable ? 'pointer' : 'default',
                      bgcolor: isSelected ? theme.palette.primary.main : 'transparent',
                      color: isSelected
                        ? theme.palette.primary.contrastText
                        : selectable
                          ? theme.palette.text.primary
                          : theme.palette.text.disabled,
                      fontSize: '0.8125rem',
                      fontWeight: isToday ? 700 : 400,
                      outline: isToday && !isSelected ? `1px solid ${theme.palette.divider}` : 'none',
                      '&:hover': selectable && !isSelected ? { bgcolor: 'action.hover' } : undefined,
                      '&:disabled': { opacity: 0.45 },
                    }}
                  >
                    {day.getDate()}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
}
