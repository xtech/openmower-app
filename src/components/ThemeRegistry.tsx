'use client';

import {darkTheme, lightTheme} from '@/theme';
import CssBaseline from '@mui/material/CssBaseline';
import {ThemeProvider} from '@mui/material/styles';
import {useEffect, useState} from 'react';

export default function ThemeRegistry({children}: {children: React.ReactNode}) {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      document.body.style.background = e.matches ? '#121212' : '#fafafa';
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Render nothing until the client has determined the preference.
  // The blocking script in layout.tsx already set the correct body background
  // via data-theme, so the page background is correct from the first paint.
  if (isDark === null) return null;

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
