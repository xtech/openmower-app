'use client';

import {DownloadButton} from '@/components/map/DownloadButton';
import {MowerMap} from '@/components/map/MowerMap';
import {UploadButton} from '@/components/map/UploadButton';
import {HeaderStat, Page, PageContent, PageHeader} from '@/components/page';
import {useMapboxDraw, useMapContext} from '@/contexts/MapContext';
import {outerCardStyles} from '@/lib/cardStyles';
import {useSelectedMower} from '@/stores/mowersStore';
import {formatAreaSize, getAreaFeatures, mapToFeatures} from '@/utils/area-converter';
import {area as turfArea} from '@turf/area';

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
  IconButton,
  List,
  ListItem,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
  type ButtonProps,
} from '@mui/material';
import {useEffect, useMemo} from 'react';

export default function MapPage() {
  const draw = useMapboxDraw();
  const {features, setFeatures, editMode, setEditMode} = useMapContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const workingAreas = useMemo(() => getAreaFeatures(features, 'mow'), [features]);
  const navigationAreas = useMemo(() => getAreaFeatures(features, 'nav'), [features]);
  const totalWorkingArea = useMemo(() => turfArea({type: 'FeatureCollection', features: workingAreas}), [workingAreas]);

  if (mapData === undefined) {
    return <div>No map data</div>;
  }

  const handleAreaAction = (action: string, areaId: string) => {
    console.log(`${action} for area ${areaId}`);
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
        <HeaderStat
          icon={<LocationIcon />}
          value={workingAreas.length + navigationAreas.length}
          label="Managed Areas"
        />
        <HeaderStat icon={<PlayIcon />} value={formatAreaSize(totalWorkingArea)} label="Total Mowing Area" />
        <HeaderStat icon={<CheckIcon />} value={workingAreas.length} label="Mowing Areas" />
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
          <Box sx={{width: isMobile ? '100%' : '400px', display: 'flex', flexDirection: 'column', gap: 3}}>
            {/* Working Areas */}
            {workingAreas.length > 0 && (
              <Card sx={outerCardStyles}>
                <CardContent>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: 2}}>
                    <Avatar sx={{bgcolor: theme.palette.primary.main, width: 40, height: 40}}>
                      {/* TerrainIcon */}
                    </Avatar>
                    <Typography variant="h5" component="h3" fontWeight="600">
                      Mowing Areas
                    </Typography>
                  </Box>

                  <List sx={{p: 0}}>
                    {workingAreas.map((area) => (
                      <ListItem
                        key={area.properties.name}
                        sx={{
                          px: 0,
                          py: 0.5,
                          cursor: 'pointer',
                          borderBottom: '1px solid',
                          borderColor: theme.palette.divider,
                          '&:last-child': {
                            borderBottom: 'none',
                          },
                          '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                          },
                        }}
                      >
                        <Box sx={{flex: 1, py: 0.5, px: 2, mr: 1}}>
                          <Typography variant="h6" fontWeight="600">
                            {area.properties.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatAreaSize(turfArea(area.geometry))} • Last mowed: Never
                          </Typography>
                        </Box>
                        <Box sx={{display: 'flex', gap: 1, mr: 2}}>
                          <IconButton
                            size="small"
                            color="error"
                            className="delete-button"
                            sx={{bgcolor: theme.palette.error.light + '20'}}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAreaAction('delete', area.properties.name || '');
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Navigation Areas */}
            {navigationAreas.length > 0 && (
              <Card sx={outerCardStyles}>
                <CardContent>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: 3}}>
                    <Avatar sx={{bgcolor: theme.palette.secondary.main, width: 40, height: 40}}>
                      {/* NavigationIcon */}
                    </Avatar>
                    <Typography variant="h5" component="h3" fontWeight="600">
                      Navigation Areas
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      </PageContent>
    </Page>
  );
}
