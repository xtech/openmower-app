'use client';

import {DownloadButton} from '@/components/map/DownloadButton';
import {MowerMap} from '@/components/map/MowerMap';
import {UploadButton} from '@/components/map/UploadButton';
import {HeaderStat, Page, PageContent, PageHeader} from '@/components/page';
import {useMapboxDraw, useMapContext} from '@/contexts/MapContext';
import {innerCardStyles, outerCardStyles} from '@/lib/cardStyles';
import {useSelectedMower} from '@/stores/mowersStore';
import {mapToFeatures} from '@/utils/area-converter';

import {
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandIcon,
  LocationOn as LocationIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
  type ButtonProps,
} from '@mui/material';
import {useEffect, useState} from 'react';

// Mock data - in real app this would come from API
const mockAreas = [
  {
    id: '1',
    name: 'Back Garden',
    status: 'active',
    size: '150m²',
    lastMowed: '2 hours ago',
    pattern: '90° rotation',
    coverage: 85,
  },
  {
    id: '2',
    name: 'Front Lawn',
    status: 'pending',
    size: '80m²',
    lastMowed: '1 day ago',
    pattern: 'Standard',
    coverage: 0,
  },
  {
    id: '3',
    name: 'Side Garden',
    status: 'completed',
    size: '45m²',
    lastMowed: '3 hours ago',
    pattern: 'Spiral',
    coverage: 100,
  },
];

export default function MapPage() {
  const draw = useMapboxDraw();
  const {setFeatures, editMode, setEditMode} = useMapContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  // In display mode, send the features directly to the map.
  // In edit mode, the draw controll will take care of updates.
  const mapData = useSelectedMower((s) => s?.map);
  useEffect(() => {
    if (draw && mapData && !editMode) {
      const features = mapToFeatures(mapData);
      draw.set(features);
      setFeatures(features);
    }
  }, [draw, mapData, editMode, setFeatures]);

  if (mapData === undefined) {
    return <div>No map data</div>;
  }

  const handleAreaAction = (action: string, areaId: string) => {
    console.log(`${action} for area ${areaId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Mowing';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage === 100) return 'success';
    if (coverage > 50) return 'warning';
    return 'error';
  };

  const buttonPropsPrimary: ButtonProps = {
    variant: 'contained',
    color: 'primary',
    size: 'medium',
    sx: {borderRadius: 2, fontWeight: 600},
  };

  const buttonPropsSecondary: ButtonProps = {
    variant: 'outlined',
    color: 'secondary',
    size: 'medium',
    sx: {borderRadius: 2, fontWeight: 600},
  };

  return (
    <Page>
      <PageHeader title="Map" subtitle="Real-time GPS tracking, area management, and intelligent path planning">
        <HeaderStat icon={<LocationIcon />} value={mockAreas.length} label="Managed Areas" />
        <HeaderStat
          icon={<PlayIcon />}
          value={mockAreas.filter((a) => a.status === 'active').length}
          label="Currently Mowing"
        />
        <HeaderStat
          icon={<CheckIcon />}
          value={`${Math.round(mockAreas.reduce((acc, a) => acc + a.coverage, 0) / mockAreas.length)}%`}
          label="Average Coverage"
        />
      </PageHeader>

      <PageContent>
        <Box sx={{display: 'flex', gap: 4, flexDirection: isMobile ? 'column' : 'row'}}>
          {/* Map Interface */}
          <Box sx={{flex: 1, minHeight: '600px'}}>
            <Card
              sx={{
                ...outerCardStyles,
                height: '100%',
              }}
            >
              <CardContent>
                {/* Interactive Map */}
                <MowerMap mapData={mapData} sx={{height: 400, borderRadius: 1, mb: 3}} />

                {/* Map Header */}
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3}}>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                    <Avatar sx={{bgcolor: theme.palette.info.main, width: 48, height: 48}}>{/* MapIcon */}</Avatar>
                    <Box>
                      <Typography variant="h5" component="h2" fontWeight="600">
                        Mower Location & Areas
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Real-time GPS tracking and area management
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{display: 'flex', gap: 1}}>
                    <Button {...buttonPropsPrimary} startIcon={<AddIcon />}>
                      Add Area
                    </Button>
                    <Button
                      {...(editMode ? buttonPropsPrimary : buttonPropsSecondary)}
                      startIcon={<EditIcon />}
                      onClick={() => setEditMode(!editMode)}
                    >
                      {editMode ? 'Exit Edit' : 'Edit'}
                    </Button>
                    <DownloadButton {...buttonPropsSecondary} />
                    <UploadButton {...buttonPropsSecondary} />
                  </Box>
                </Box>

                {/* Manual Control Panel */}
                <Box sx={{mt: 4}}>
                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1}}
                  >
                    {/* MyLocationIcon */}
                    Manual Control
                  </Typography>
                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.grey[100]} 100%)`,
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center'}}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<PlayIcon />}
                        onClick={() => handleAreaAction('start', 'manual')}
                        sx={{
                          px: 4,
                          py: 1.5,
                          borderRadius: 3,
                          fontWeight: 600,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
                          '&:hover': {
                            boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
                          },
                        }}
                      >
                        Start Mowing
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        size="large"
                        startIcon={<StopIcon />}
                        onClick={() => handleAreaAction('stop', 'manual')}
                        sx={{
                          px: 4,
                          py: 1.5,
                          borderRadius: 3,
                          fontWeight: 600,
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                          },
                        }}
                      >
                        Stop
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="large"
                        startIcon={<ExpandIcon />}
                        onClick={() => handleAreaAction('dock', 'manual')}
                        sx={{
                          px: 4,
                          py: 1.5,
                          borderRadius: 3,
                          fontWeight: 600,
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                          },
                        }}
                      >
                        Return to Dock
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Area Management Sidebar */}
          <Box sx={{width: isMobile ? '100%' : '400px'}}>
            <Card sx={outerCardStyles}>
              <CardContent>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: 3}}>
                  <Avatar sx={{bgcolor: theme.palette.success.main, width: 40, height: 40}}>{/* TerrainIcon */}</Avatar>
                  <Typography variant="h5" component="h3" fontWeight="600">
                    Mowing Areas
                  </Typography>
                </Box>

                <Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                  {mockAreas.map((area) => (
                    <Card
                      key={area.id}
                      sx={{
                        ...innerCardStyles,
                        borderColor: selectedArea === area.id ? theme.palette.primary.main : undefined,
                        backgroundColor: selectedArea === area.id ? theme.palette.primary.light + '10' : undefined,
                        '&:hover': {
                          ...innerCardStyles['&:hover'],
                          borderColor: theme.palette.primary.main,
                          backgroundColor: theme.palette.primary.light + '05',
                        },
                      }}
                      onClick={() => setSelectedArea(area.id)}
                    >
                      <CardContent sx={{py: 2.5, '&:last-child': {pb: 2.5}}}>
                        {/* Area Header */}
                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2}}>
                          <Box>
                            <Typography variant="h6" fontWeight="600" gutterBottom>
                              {area.name}
                            </Typography>
                            <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                              <Chip
                                label={getStatusLabel(area.status)}
                                color={getStatusColor(area.status)}
                                size="small"
                                sx={{fontWeight: 500}}
                              />
                              <Chip label={area.pattern} variant="outlined" size="small" sx={{fontWeight: 500}} />
                            </Box>
                          </Box>
                          <Box sx={{display: 'flex', gap: 1}}>
                            <IconButton size="small" color="primary" sx={{bgcolor: theme.palette.primary.light + '20'}}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" sx={{bgcolor: theme.palette.error.light + '20'}}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Area Details */}
                        <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2}}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Size
                            </Typography>
                            <Typography variant="body2" fontWeight="500">
                              {area.size}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Coverage
                            </Typography>
                            <Typography variant="body2" fontWeight="500" color={getCoverageColor(area.coverage)}>
                              {area.coverage}%
                            </Typography>
                          </Box>
                        </Box>

                        {/* Last Mowed */}
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                          <Typography variant="caption" color="text.secondary">
                            Last mowed: {area.lastMowed}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </PageContent>
    </Page>
  );
}
