import {loadAppConfig} from '@/lib/actions';
import {Box} from '@mui/material';
import {AppRouterCacheProvider} from '@mui/material-nextjs/v15-appRouter';
import type {Metadata} from 'next';
import {Roboto} from 'next/font/google';
import {DialogProvider} from 'react-dialog-async';
import {ConfigInitializer} from '../components/ConfigInitializer';
import ThemeRegistry from '../components/ThemeRegistry';
import Navigation from '../components/navigation/Navigation';
import './globals.css';

export const dynamic = 'force-dynamic';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'OpenMower App',
  description: 'Control and monitor your OpenMower robotic lawnmower',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await loadAppConfig();
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Runs before React hydrates — sets body background immediately so the
            blank-before-mount period matches the final theme colour */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme',d?'dark':'light');document.body.style.background=d?'#121212':'#fafafa';}catch(e){}})()`,
          }}
        />
        <ConfigInitializer config={config} />
        <AppRouterCacheProvider>
          <ThemeRegistry>
            <DialogProvider>
              <Box sx={{display: 'flex', height: '100dvh'}}>
                <Navigation />
                <Box
                  component="main"
                  sx={{
                    flex: 1,
                    pb: {xs: 7, md: 0}, // Account for mobile bottom navigation
                    margin: 0,
                    padding: 0,
                    width: '100%',
                    overflow: 'auto',
                    overflowAnchor: 'none',
                  }}
                >
                  {children}
                </Box>
              </Box>
            </DialogProvider>
          </ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
