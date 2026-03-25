'use client';

import {HeaderStat, Page, PageContent, PageHeader} from '@/components/page';
import {innerCardStyles, outerCardStyles} from '@/lib/cardStyles';

import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  List,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {useState} from 'react';

// Mock data - in real app this would come from API
const mockTasks = [
  {
    id: '1',
    name: 'Mow Back Garden',
    area: 'Back Garden',
    priority: 'high',
    status: 'active',
    estimatedTime: '45 min',
    pattern: '90° rotation',
    nextRun: 'Today, 2:00 PM',
    lastRun: 'Yesterday, 3:30 PM',
    efficiency: 92,
  },
  {
    id: '2',
    name: 'Mow Front Lawn',
    area: 'Front Lawn',
    priority: 'medium',
    status: 'pending',
    estimatedTime: '30 min',
    pattern: 'Standard',
    nextRun: 'Tomorrow, 9:00 AM',
    lastRun: '2 days ago',
    efficiency: 88,
  },
  {
    id: '3',
    name: 'Mow Back Garden (45° rotation)',
    area: 'Back Garden',
    priority: 'low',
    status: 'scheduled',
    estimatedTime: '45 min',
    pattern: '45° rotation',
    nextRun: 'Friday, 10:00 AM',
    lastRun: 'Never',
    efficiency: 0,
  },
];

export default function TasksPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const handleTaskAction = (action: string, taskId: string) => {
    console.log(`${action} for task ${taskId}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'scheduled':
        return 'info';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Running';
      case 'pending':
        return 'Pending';
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  return (
    <Page>
      <PageHeader title="Task Management" subtitle="Schedule and manage mowing sequences with precision">
        <HeaderStat icon={<AssignmentIcon />} value={mockTasks.length} label="Total Tasks" />
        <HeaderStat
          icon={<PlayIcon />}
          value={mockTasks.filter((t) => t.status === 'active').length}
          label="Active Tasks"
        />
        <HeaderStat
          icon={<TrendingIcon />}
          value={`${Math.round(mockTasks.reduce((acc, t) => acc + t.efficiency, 0) / mockTasks.length)}%`}
          label="Average Efficiency"
        />
      </PageHeader>

      <PageContent>
        <Box sx={{display: 'flex', gap: 4, flexDirection: isMobile ? 'column' : 'row'}}>
          {/* Task List */}
          <Box sx={{flex: 1}}>
            <Card sx={outerCardStyles(theme)}>
              <CardContent>
                {/* Task List Header */}
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4}}>
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                    <Avatar sx={{bgcolor: theme.palette.warning.main, width: 48, height: 48}}>
                      <AssignmentIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" component="h2" fontWeight="600">
                        Mowing Tasks
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage your automated mowing schedule
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{display: 'flex', gap: 1}}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      sx={{borderRadius: 2, fontWeight: 600}}
                    >
                      Add Task
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<ScheduleIcon />}
                      sx={{borderRadius: 2, fontWeight: 600}}
                    >
                      Schedule
                    </Button>
                  </Box>
                </Box>

                <List sx={{p: 0}}>
                  {mockTasks.map((task) => (
                    <Card
                      key={task.id}
                      sx={{
                        ...innerCardStyles,
                        mb: 3,
                        borderColor: selectedTask === task.id ? theme.palette.primary.main : undefined,
                        backgroundColor: selectedTask === task.id ? theme.palette.primary.light + '10' : undefined,
                        '&:hover': {
                          ...innerCardStyles['&:hover'],
                          borderColor: theme.palette.primary.main,
                          backgroundColor: theme.palette.primary.light + '05',
                        },
                      }}
                      onClick={() => setSelectedTask(task.id)}
                    >
                      <CardContent sx={{py: 3, '&:last-child': {pb: 3}}}>
                        <Box sx={{display: 'flex', alignItems: 'flex-start', gap: 3}}>
                          <DragIcon sx={{mt: 1, color: theme.palette.grey[400]}} />

                          <Box sx={{flex: 1}}>
                            {/* Task Header */}
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: 2}}>
                              <Typography variant="h6" fontWeight="600">
                                {task.name}
                              </Typography>
                              <Chip
                                label={task.priority}
                                color={getPriorityColor(task.priority)}
                                size="small"
                                sx={{fontWeight: 500}}
                              />
                              <Chip
                                label={getStatusLabel(task.status)}
                                color={getStatusColor(task.status)}
                                size="small"
                                sx={{fontWeight: 500}}
                              />
                            </Box>

                            {/* Task Details */}
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: 2,
                                mb: 2,
                              }}
                            >
                              <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Area
                                </Typography>
                                <Typography variant="body1" fontWeight="500">
                                  {task.area}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Pattern
                                </Typography>
                                <Typography variant="body1" fontWeight="500">
                                  {task.pattern}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Est. Time
                                </Typography>
                                <Typography variant="body1" fontWeight="500">
                                  {task.estimatedTime}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Efficiency
                                </Typography>
                                <Typography
                                  variant="body1"
                                  fontWeight="500"
                                  color={task.efficiency > 80 ? 'success.main' : 'warning.main'}
                                >
                                  {task.efficiency}%
                                </Typography>
                              </Box>
                            </Box>

                            {/* Schedule Info */}
                            <Box sx={{display: 'flex', gap: 3, flexWrap: 'wrap'}}>
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Next Run
                                </Typography>
                                <Typography variant="body2" fontWeight="500">
                                  {task.nextRun}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Last Run
                                </Typography>
                                <Typography variant="body2" fontWeight="500">
                                  {task.lastRun}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Action Buttons */}
                          <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                            {task.status === 'active' ? (
                              <IconButton
                                color="warning"
                                sx={{
                                  bgcolor: theme.palette.warning.light + '20',
                                  '&:hover': {bgcolor: theme.palette.warning.light + '30'},
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskAction('pause', task.id);
                                }}
                              >
                                <PlayIcon />
                              </IconButton>
                            ) : (
                              <IconButton
                                color="primary"
                                sx={{
                                  bgcolor: theme.palette.primary.light + '20',
                                  '&:hover': {bgcolor: theme.palette.primary.light + '30'},
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTaskAction('start', task.id);
                                }}
                              >
                                <PlayIcon />
                              </IconButton>
                            )}

                            <IconButton
                              color="primary"
                              sx={{
                                bgcolor: theme.palette.primary.light + '20',
                                '&:hover': {bgcolor: theme.palette.primary.light + '30'},
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskAction('edit', task.id);
                              }}
                            >
                              <EditIcon />
                            </IconButton>

                            <IconButton
                              color="error"
                              sx={{
                                bgcolor: theme.palette.error.light + '20',
                                '&:hover': {bgcolor: theme.palette.error.light + '30'},
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskAction('delete', task.id);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* Task Details Sidebar */}
          <Box sx={{width: isMobile ? '100%' : '400px'}}>
            <Card sx={outerCardStyles(theme)}>
              <CardContent>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: 3}}>
                  <Avatar sx={{bgcolor: theme.palette.info.main, width: 40, height: 40}}>
                    <CheckIcon />
                  </Avatar>
                  <Typography variant="h5" component="h3" fontWeight="600">
                    Task Details
                  </Typography>
                </Box>

                {selectedTask ? (
                  <Box>
                    {(() => {
                      const task = mockTasks.find((t) => t.id === selectedTask);
                      if (!task) return null;

                      return (
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Task Name
                            </Typography>
                            <Typography variant="h6" fontWeight="600">
                              {task.name}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Area
                            </Typography>
                            <Typography variant="body1">{task.area}</Typography>
                          </Box>

                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Pattern
                            </Typography>
                            <Typography variant="body1">{task.pattern}</Typography>
                          </Box>

                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Estimated Time
                            </Typography>
                            <Typography variant="body1">{task.estimatedTime}</Typography>
                          </Box>

                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Next Run
                            </Typography>
                            <Typography variant="body1">{task.nextRun}</Typography>
                          </Box>

                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Last Run
                            </Typography>
                            <Typography variant="body1">{task.lastRun}</Typography>
                          </Box>

                          <Divider sx={{my: 2}} />

                          <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            startIcon={<PlayIcon />}
                            onClick={() => handleTaskAction('start', task.id)}
                            sx={{
                              py: 1.5,
                              borderRadius: 3,
                              fontWeight: 600,
                              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                              '&:hover': {
                                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                              },
                            }}
                          >
                            Start Task
                          </Button>
                        </Box>
                      );
                    })()}
                  </Box>
                ) : (
                  <Box sx={{textAlign: 'center', py: 6}}>
                    <AssignmentIcon sx={{fontSize: 64, color: theme.palette.grey[400], mb: 2}} />
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Select a task to view details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Choose any task from the list to see comprehensive information
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </PageContent>
    </Page>
  );
}
