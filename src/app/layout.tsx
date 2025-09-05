import {loadAppConfig} from '@/lib/actions';
import {Box} from '@mui/material';
import {AppRouterCacheProvider} from '@mui/material-nextjs/v15-appRouter';
import {ThemeProvider} from '@mui/material/styles';
import type {Metadata} from 'next';
import {Roboto} from 'next/font/google';
import {ConfigInitializer} from '../components/ConfigInitializer';
import Navigation from '../components/navigation/Navigation';
import theme from '../theme';
import './globals.css';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'LawnBot Control',
  description: 'Control and monitor your robotic lawnmowers',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await loadAppConfig();
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <ConfigInitializer config={config} />
        <ThemeProvider theme={theme}>
          <AppRouterCacheProvider>
            <Box sx={{display: 'flex', height: '100vh'}}>
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
                }}
              >
                {children}
              </Box>
            </Box>
          </AppRouterCacheProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
