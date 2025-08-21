'use client';

import {HeaderStat, Page, PageContent, PageHeader} from '@/components/page';

import {
  BatteryFull as BatteryIcon,
  CheckCircle as CheckIcon,
  GpsFixed as GpsIcon,
  Speed as SpeedIcon,
  Thermostat as TempIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {Box, Card, CardContent, Chip, LinearProgress, Typography} from '@mui/material';

// Mock data - in real app this would come from API
const mockSensorData = {
  battery: {
    voltage: 24.2,
    current: 2.1,
    temperature: 35,
    health: 'good',
    estimatedTime: '2h 15m',
  },
  motors: {
    leftWheel: {rpm: 120, power: 85, temperature: 42},
    rightWheel: {rpm: 118, power: 83, temperature: 41},
    blade: {rpm: 2800, power: 92, temperature: 38},
  },
  sensors: {
    gps: {accuracy: '±0.5m', satellites: 8, status: 'good'},
    obstacle: {front: 'clear', left: 'clear', right: 'clear', status: 'good'},
    rain: {detected: false, humidity: 45, status: 'good'},
  },
  system: {
    uptime: '3h 22m',
    errors: 0,
    warnings: 1,
    status: 'operational',
  },
};

export default function SensorsPage() {
  const getBatteryHealthColor = (health: string) => {
    switch (health) {
      case 'good':
        return 'success';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSensorStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'success';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Page>
      <PageHeader
        title="Sensor Data & Diagnostics"
        subtitle="Real-time monitoring and system health across all mower systems"
      >
        <HeaderStat icon={<BatteryIcon />} value={`${mockSensorData.battery.voltage}V`} label="Battery Voltage" />
        <HeaderStat icon={<GpsIcon />} value={mockSensorData.sensors.gps.satellites} label="GPS Satellites" />
        <HeaderStat icon={<CheckIcon />} value={mockSensorData.system.errors} label="System Errors" />
      </PageHeader>

      <PageContent>
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
          {/* System Status Overview */}
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                System Status
              </Typography>
              <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center'}}>
                <Chip
                  label={mockSensorData.system.status}
                  color={getSystemStatusColor(mockSensorData.system.status)}
                  icon={<CheckIcon />}
                />
                <Typography variant="body2" color="text.secondary">
                  Uptime: {mockSensorData.system.uptime}
                </Typography>
                <Chip
                  label={`${mockSensorData.system.errors} Errors`}
                  color={mockSensorData.system.errors > 0 ? 'error' : 'default'}
                  size="small"
                />
                <Chip
                  label={`${mockSensorData.system.warnings} Warnings`}
                  color={mockSensorData.system.warnings > 0 ? 'warning' : 'default'}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Battery Status */}
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Battery Status
              </Typography>
              <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 3}}>
                <Box sx={{flex: '1', minWidth: '200px'}}>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 1}}>
                    <BatteryIcon color="primary" />
                    <Typography variant="subtitle2">Voltage</Typography>
                  </Box>
                  <Typography variant="h4" color="primary" fontWeight="medium">
                    {mockSensorData.battery.voltage}V
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nominal: 24V
                  </Typography>
                </Box>

                <Box sx={{flex: '1', minWidth: '200px'}}>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 1}}>
                    <SpeedIcon color="primary" />
                    <Typography variant="subtitle2">Current</Typography>
                  </Box>
                  <Typography variant="h4" color="primary" fontWeight="medium">
                    {mockSensorData.battery.current}A
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Peak: 5A
                  </Typography>
                </Box>

                <Box sx={{flex: '1', minWidth: '200px'}}>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 1}}>
                    <TempIcon color="primary" />
                    <Typography variant="subtitle2">Temperature</Typography>
                  </Box>
                  <Typography variant="h4" color="primary" fontWeight="medium">
                    {mockSensorData.battery.temperature}°C
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Range: 0-60°C
                  </Typography>
                </Box>

                <Box sx={{flex: '1', minWidth: '200px'}}>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 1}}>
                    <CheckIcon color="primary" />
                    <Typography variant="subtitle2">Health</Typography>
                  </Box>
                  <Chip
                    label={mockSensorData.battery.health}
                    color={getBatteryHealthColor(mockSensorData.battery.health)}
                    size="medium"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                    Est. Time: {mockSensorData.battery.estimatedTime}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Motor Status */}
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Motor Status
              </Typography>
              <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 3}}>
                {Object.entries(mockSensorData.motors).map(([motor, data]) => (
                  <Box key={motor} sx={{flex: '1', minWidth: '200px'}}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{textTransform: 'capitalize'}}>
                      {motor.replace(/([A-Z])/g, ' $1').trim()}
                    </Typography>

                    <Box sx={{mb: 2}}>
                      <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 0.5}}>
                        <Typography variant="body2" color="text.secondary">
                          RPM
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {data.rpm}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(data.rpm / 3000) * 100}
                        color="primary"
                        sx={{height: 6, borderRadius: 3}}
                      />
                    </Box>

                    <Box sx={{mb: 2}}>
                      <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 0.5}}>
                        <Typography variant="body2" color="text.secondary">
                          Power
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {data.power}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={data.power}
                        color="success"
                        sx={{height: 6, borderRadius: 3}}
                      />
                    </Box>

                    <Box>
                      <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 0.5}}>
                        <Typography variant="body2" color="text.secondary">
                          Temperature
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {data.temperature}°C
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(data.temperature / 80) * 100}
                        color={data.temperature > 60 ? 'warning' : 'info'}
                        sx={{height: 6, borderRadius: 3}}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Sensor Status */}
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Sensor Status
              </Typography>
              <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 3}}>
                {/* GPS Status */}
                <Box sx={{flex: '1', minWidth: '250px'}}>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 2}}>
                    <GpsIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">
                      GPS
                    </Typography>
                    <Chip
                      label={mockSensorData.sensors.gps.status}
                      color={getSensorStatusColor(mockSensorData.sensors.gps.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Accuracy: {mockSensorData.sensors.gps.accuracy}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Satellites: {mockSensorData.sensors.gps.satellites}
                  </Typography>
                </Box>

                {/* Obstacle Detection */}
                <Box sx={{flex: '1', minWidth: '250px'}}>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 2}}>
                    <WarningIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">
                      Obstacle Detection
                    </Typography>
                    <Chip
                      label={mockSensorData.sensors.obstacle.status}
                      color={getSensorStatusColor(mockSensorData.sensors.obstacle.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Front: {mockSensorData.sensors.obstacle.front}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Left: {mockSensorData.sensors.obstacle.left}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Right: {mockSensorData.sensors.obstacle.right}
                  </Typography>
                </Box>

                {/* Rain Sensor */}
                <Box sx={{flex: '1', minWidth: '250px'}}>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 2}}>
                    <TempIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">
                      Environmental
                    </Typography>
                    <Chip
                      label={mockSensorData.sensors.rain.status}
                      color={getSensorStatusColor(mockSensorData.sensors.rain.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Rain: {mockSensorData.sensors.rain.detected ? 'Detected' : 'None'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Humidity: {mockSensorData.sensors.rain.humidity}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </PageContent>
    </Page>
  );
}
