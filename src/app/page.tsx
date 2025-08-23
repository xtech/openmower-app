'use client';

import {HeaderStat, Page, PageContent, PageHeader} from '@/components/page';
import {useConfig} from '@/contexts/ConfigContext';
import {
  Battery90 as BatteryIcon,
  CheckCircle as CheckIcon,
  Home as HomeIcon,
  LocationOn as LocationIcon,
  PlayArrow as PlayIcon,
  SkipNext as SkipIcon,
  Speed as SpeedIcon,
  Stop as StopIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {Avatar, Box, Button, Card, CardContent, Chip, LinearProgress, Paper, Typography, useTheme} from '@mui/material';
import {useState} from 'react';

// Mock status data - in real app this would come from MQTT
const mockStatusData = {
  '1': {
    status: 'active',
    battery: 85,
    operation: 'Mowing Back Garden',
    estimatedTime: '45 min',
    location: 'Back Garden',
    lastSeen: '2 min ago',
    efficiency: 92,
    speed: '0.8 m/s',
  },
  '2': {
    status: 'docked',
    battery: 100,
    operation: 'Charging',
    estimatedTime: 'Ready',
    location: 'Docking Station',
    lastSeen: '5 min ago',
    efficiency: 88,
    speed: '0 m/s',
  },
};

export default function Dashboard() {
  const theme = useTheme();
  const {mowers} = useConfig();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: string, mowerId: string) => {
    setIsProcessing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`${action} for mower ${mowerId}`);
    setIsProcessing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'docked':
        return 'info';
      case 'error':
        return 'error';
      case 'charging':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Mowing';
      case 'docked':
        return 'Docked';
      case 'error':
        return 'Error';
      case 'charging':
        return 'Charging';
      default:
        return 'Unknown';
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return 'success';
    if (battery > 20) return 'warning';
    return 'error';
  };

  // Combine mower config with mock status data
  const mowersWithStatus = mowers.map((mower) => {
    const statusData = mockStatusData[mower.id as keyof typeof mockStatusData];
    return {
      ...mower,
      ...statusData,
    };
  });

  return (
    <Page>
      <PageHeader
        title="Welcome to LawnBot Control"
        subtitle="Monitor and control your robotic lawnmowers with precision"
      >
        <HeaderStat icon={<TrendingIcon />} value={mowers.length} label="Active Mowers" />
        <HeaderStat
          icon={<SpeedIcon />}
          value={mowersWithStatus.filter((m) => m.status === 'active').length}
          label="Currently Mowing"
        />
        <HeaderStat
          icon={<CheckIcon />}
          value={
            mowers.length > 0
              ? `${Math.round(
                  mowersWithStatus.reduce((acc, m) => acc + (m.efficiency || 0), 0) / mowersWithStatus.length,
                )}%`
              : '0%'
          }
          label="Average Efficiency"
        />
      </PageHeader>

      <PageContent>
        {mowers.length === 0 ? (
          <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px'}}>
            <Typography variant="h6" color="text.secondary">
              No mowers configured. Please add mowers to your config.json file.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Mower Status Cards */}
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 3, mb: 6}}>
              {mowersWithStatus.map((mower) => (
                <Card
                  key={mower.id}
                  sx={{
                    flex: '1 1 450px',
                    minWidth: 0,
                    borderRadius: 4,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
                    },
                  }}
                >
                  <CardContent sx={{p: 4}}>
                    {/* Header with Status */}
                    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3}}>
                      <Box>
                        <Typography
                          variant="h4"
                          component="h2"
                          gutterBottom
                          sx={{fontWeight: 700, color: theme.palette.text.primary}}
                        >
                          {mower.name}
                        </Typography>
                        <Chip
                          label={getStatusLabel(mower.status)}
                          color={getStatusColor(mower.status)}
                          size="medium"
                          sx={{fontWeight: 600, px: 2}}
                        />
                      </Box>
                      <Avatar
                        sx={{
                          bgcolor: (() => {
                            const color = getStatusColor(mower.status);
                            return color === 'success'
                              ? theme.palette.success.main
                              : color === 'warning'
                              ? theme.palette.warning.main
                              : color === 'error'
                              ? theme.palette.error.main
                              : theme.palette.info.main;
                          })(),
                          width: 56,
                          height: 56,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                      >
                        <LocationIcon />
                      </Avatar>
                    </Box>

                    {/* Battery Status with Enhanced Visual */}
                    <Box sx={{mb: 4}}>
                      <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2}}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                          <BatteryIcon color={getBatteryColor(mower.battery)} sx={{fontSize: 28}} />
                          <Typography variant="h6" fontWeight="600">
                            Battery Status
                          </Typography>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color={getBatteryColor(mower.battery)}>
                          {mower.battery}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={mower.battery}
                        color={getBatteryColor(mower.battery)}
                        sx={{
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 6,
                          },
                        }}
                      />
                    </Box>

                    {/* Operation Info with Icons */}
                    <Box sx={{mb: 4}}>
                      <Typography variant="h6" fontWeight="600" gutterBottom sx={{color: theme.palette.text.secondary}}>
                        Current Operation
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          bgcolor: theme.palette.grey[50],
                          borderRadius: 2,
                        }}
                      >
                        <PlayIcon color="primary" />
                        <Typography variant="body1" fontWeight="500">
                          {mower.operation}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Enhanced Metrics Grid */}
                    <Box
                      sx={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 2, mb: 4}}
                    >
                      <Box
                        sx={{textAlign: 'center', p: 2, bgcolor: theme.palette.primary.light + '10', borderRadius: 2}}
                      >
                        <TimerIcon color="primary" sx={{fontSize: 24, mb: 1}} />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Est. Time
                        </Typography>
                        <Typography variant="h6" fontWeight="600" color="primary">
                          {mower.estimatedTime}
                        </Typography>
                      </Box>

                      <Box
                        sx={{textAlign: 'center', p: 2, bgcolor: theme.palette.success.light + '10', borderRadius: 2}}
                      >
                        <SpeedIcon color="success" sx={{fontSize: 24, mb: 1}} />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Speed
                        </Typography>
                        <Typography variant="h6" fontWeight="600" color="success.main">
                          {mower.speed}
                        </Typography>
                      </Box>

                      <Box sx={{textAlign: 'center', p: 2, bgcolor: theme.palette.info.light + '10', borderRadius: 2}}>
                        <TrendingIcon color="info" sx={{fontSize: 24, mb: 1}} />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Efficiency
                        </Typography>
                        <Typography variant="h6" fontWeight="600" color="info.main">
                          {mower.efficiency}%
                        </Typography>
                      </Box>
                    </Box>

                    {/* Quick Actions with Enhanced Buttons */}
                    <Box sx={{display: 'flex', gap: 2}}>
                      {mower.status === 'active' ? (
                        <>
                          <Button
                            variant="contained"
                            color="warning"
                            size="large"
                            sx={{flex: 1, py: 1.5, borderRadius: 3, fontWeight: 600}}
                            startIcon={<StopIcon />}
                            onClick={() => handleAction('stop', mower.id)}
                            disabled={isProcessing}
                          >
                            Stop Mowing
                          </Button>
                          <Button
                            variant="outlined"
                            color="info"
                            size="large"
                            sx={{flex: 1, py: 1.5, borderRadius: 3, fontWeight: 600}}
                            startIcon={<SkipIcon />}
                            onClick={() => handleAction('skip', mower.id)}
                            disabled={isProcessing}
                          >
                            Skip Area
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{flex: 1, py: 1.5, borderRadius: 3, fontWeight: 600}}
                            startIcon={<PlayIcon />}
                            onClick={() => handleAction('start', mower.id)}
                            disabled={isProcessing}
                          >
                            Start Mowing
                          </Button>
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="large"
                            sx={{flex: 1, py: 1.5, borderRadius: 3, fontWeight: 600}}
                            startIcon={<HomeIcon />}
                            onClick={() => handleAction('dock', mower.id)}
                            disabled={isProcessing}
                          >
                            Return to Dock
                          </Button>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Global Actions with Enhanced Design */}
            <Paper
              sx={{
                p: 4,
                borderRadius: 4,
                background: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.grey[100]} 100%)`,
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <Box sx={{textAlign: 'center', mb: 4}}>
                <Typography variant="h4" component="h3" gutterBottom sx={{fontWeight: 700}}>
                  Fleet Control Center
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Manage all your mowers simultaneously
                </Typography>
              </Box>

              <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center'}}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{
                    px: 4,
                    py: 2,
                    borderRadius: 3,
                    fontWeight: 600,
                    minWidth: 180,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                    },
                  }}
                  startIcon={<PlayIcon />}
                  onClick={() => handleAction('startAll', 'all')}
                  disabled={isProcessing}
                >
                  Start All Mowers
                </Button>

                <Button
                  variant="outlined"
                  color="warning"
                  size="large"
                  sx={{
                    px: 4,
                    py: 2,
                    borderRadius: 3,
                    fontWeight: 600,
                    minWidth: 180,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                  startIcon={<StopIcon />}
                  onClick={() => handleAction('stopAll', 'all')}
                  disabled={isProcessing}
                >
                  Stop All Mowers
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  sx={{
                    px: 4,
                    py: 2,
                    borderRadius: 3,
                    fontWeight: 600,
                    minWidth: 180,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                  startIcon={<HomeIcon />}
                  onClick={() => handleAction('dockAll', 'all')}
                  disabled={isProcessing}
                >
                  Dock All Mowers
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  sx={{
                    px: 4,
                    py: 2,
                    borderRadius: 3,
                    fontWeight: 600,
                    minWidth: 180,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                  startIcon={<WarningIcon />}
                  onClick={() => handleAction('emergency', 'all')}
                  disabled={isProcessing}
                >
                  Emergency Stop
                </Button>
              </Box>
            </Paper>
          </>
        )}
      </PageContent>
    </Page>
  );
}
