'use client';

import {HeaderStat, Page, PageContent, PageHeader} from '@/components/page';
import BatteryGauge from '@/components/simulation/BatteryGauge';
import DisplaceCard from '@/components/simulation/DisplaceCard';
import DockCard from '@/components/simulation/DockCard';
import EmergencyCard from '@/components/simulation/EmergencyCard';
import ToggleCard from '@/components/simulation/ToggleCard';
import {useSimControl} from '@/hooks/useSimControl';
import {outerCardStyles} from '@/lib/cardStyles';
import {useSelectedMower} from '@/stores/mowersStore';
import {
  BatteryFull as BatteryIcon,
  ReportProblem as EmergencyIcon,
  GpsFixed as GpsFixedIcon,
  GpsOff as GpsOffIcon,
  MoveDown as MoveIcon,
  ScienceOutlined as ScienceIcon,
  DoNotDisturbOn as StuckIcon,
} from '@mui/icons-material';
import {Alert, Box, Card, CardContent, Snackbar, Typography, useTheme} from '@mui/material';

export default function SimulationPage() {
  const theme = useTheme();
  const robotBattery = useSelectedMower((m) => m?.state.battery_percentage ?? null);
  const {
    simState,
    available,
    pending,
    error,
    setEmergency,
    setMovementAllowed,
    setBatteryVoltage,
    setGpsGood,
    moveToDock,
    displace,
  } = useSimControl();

  return (
    <Page>
      <PageHeader title="Simulation" subtitle="Drive the simulated mower into interesting test states">
        <HeaderStat icon={<BatteryIcon />} value={robotBattery !== null ? `${robotBattery}%` : '—'} label="Battery" />
        <HeaderStat
          icon={<GpsFixedIcon />}
          value={simState ? (simState.gps_good ? 'RTK' : 'No fix') : '—'}
          label="GPS"
        />
        <HeaderStat
          icon={<EmergencyIcon />}
          value={simState ? (simState.emergency_latch ? 'Latched' : 'Clear') : '—'}
          label="Emergency"
        />
      </PageHeader>

      <PageContent>
        {!available ? (
          <Card sx={outerCardStyles(theme)}>
            <CardContent>
              <Box sx={{py: 6, textAlign: 'center'}}>
                <ScienceIcon sx={{fontSize: 56, color: theme.palette.grey[400], mb: 1.5}} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Simulator not detected
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{maxWidth: 420, mx: 'auto'}}>
                  These controls are only available when connected to the <code>mower_simulation</code> node. Waiting
                  for a retained <code>sim/state/json</code> message…
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          simState && (
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
              <EmergencyCard
                latched={simState.emergency_latch}
                reason={simState.emergency_reason}
                pending={pending === 'emergency'}
                onSet={setEmergency}
              />

              <Box
                sx={{
                  display: 'grid',
                  gap: 3,
                  gridTemplateColumns: {xs: '1fr', md: 'repeat(2, 1fr)'},
                }}
              >
                <Card sx={outerCardStyles(theme)}>
                  <CardContent>
                    <BatteryGauge
                      voltage={simState.battery_voltage}
                      charging={simState.charging}
                      pending={pending === 'battery'}
                      onSetVoltage={setBatteryVoltage}
                    />
                  </CardContent>
                </Card>

                <Card sx={outerCardStyles(theme)}>
                  <CardContent>
                    <ToggleCard
                      icon={simState.movement_allowed ? <MoveIcon /> : <StuckIcon />}
                      title="Traction (stuck simulation)"
                      description="Wheels keep turning but position is frozen — like a mower physically blocked while spinning. Unlike a 0/0 joystick command, the wheels don't stop."
                      value={simState.movement_allowed}
                      pending={pending === 'movement'}
                      onChange={setMovementAllowed}
                      trueOption={{label: 'Free', sub: 'Wheels turn, robot moves', color: 'success'}}
                      falseOption={{label: 'Stuck', sub: 'Wheels turn, position frozen', color: 'warning'}}
                    />
                  </CardContent>
                </Card>

                <Card sx={outerCardStyles(theme)}>
                  <CardContent>
                    <ToggleCard
                      icon={simState.gps_good ? <GpsFixedIcon /> : <GpsOffIcon />}
                      title="GPS quality"
                      value={simState.gps_good}
                      pending={pending === 'gps'}
                      onChange={setGpsGood}
                      trueOption={{label: 'RTK Fix', sub: '~2 cm', color: 'success'}}
                      falseOption={{label: 'No Fix', sub: '~1 m', color: 'error'}}
                    />
                  </CardContent>
                </Card>

                <Card sx={outerCardStyles(theme)}>
                  <CardContent>
                    <DockCard charging={simState.charging} pending={pending === 'dock'} onMoveToDock={moveToDock} />
                  </CardContent>
                </Card>

                <Card sx={outerCardStyles(theme)}>
                  <CardContent>
                    <DisplaceCard pending={pending === 'displace'} onDisplace={displace} />
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )
        )}
      </PageContent>

      <Snackbar open={!!error} autoHideDuration={4000} anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}>
        <Alert severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </Page>
  );
}
