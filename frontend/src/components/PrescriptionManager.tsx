import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip,
  LinearProgress,
  Tooltip,
  Zoom,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Notifications as NotificationsIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { prescriptionService } from '../services/prescriptionService';
import { format } from 'date-fns';

interface Prescription {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  refillsRemaining: number;
  lastFilled: string;
  nextRefillDate: string;
}

const PrescriptionManager: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'add' | 'edit' | 'refill' | 'reminder' | 'interaction'>('add');
  const [interactions, setInteractions] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);

  useEffect(() => {
    loadPrescriptions();
    setupEventListeners();
  }, []);

  const setupEventListeners = () => {
    prescriptionService.onInteractionAlert((interaction) => {
      setInteractions((prev) => [...prev, interaction]);
    });

    prescriptionService.onReminderDue((reminder) => {
      setReminders((prev) => [...prev, reminder]);
    });

    prescriptionService.onLowStockAlert((item) => {
      setInventory((prev) => [...prev, item]);
    });

    prescriptionService.onRefillStatusUpdate((refill) => {
      loadPrescriptions();
    });

    prescriptionService.onCostUpdate((cost) => {
      setCosts((prev) => [...prev, cost]);
    });
  };

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      // Load prescriptions
      const response = await fetch('/api/prescriptions');
      const data = await response.json();
      setPrescriptions(data);

      // Load additional data
      const medicationIds = data.map((p: Prescription) => p.medicationId);
      const [interactionsData, inventoryData, costsData] = await Promise.all([
        prescriptionService.checkMedicationInteractions(medicationIds),
        prescriptionService.getInventoryStatus(medicationIds),
        prescriptionService.getMedicationCosts(medicationIds),
      ]);

      setInteractions(interactionsData);
      setInventory(inventoryData);
      setCosts(costsData);
    } catch (err) {
      setError('Failed to load prescriptions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type: 'add' | 'edit' | 'refill' | 'reminder' | 'interaction', prescription?: Prescription) => {
    setDialogType(type);
    setSelectedPrescription(prescription || null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPrescription(null);
  };

  const handleSavePrescription = async (prescriptionData: Partial<Prescription>) => {
    try {
      if (dialogType === 'add') {
        await fetch('/api/prescriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prescriptionData),
        });
      } else if (dialogType === 'edit' && selectedPrescription) {
        await fetch(`/api/prescriptions/${selectedPrescription.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prescriptionData),
        });
      }
      loadPrescriptions();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save prescription');
      console.error(err);
    }
  };

  const handleRequestRefill = async (prescriptionId: string) => {
    try {
      await prescriptionService.requestRefill({
        prescriptionId,
        medicationId: selectedPrescription?.medicationId || '',
        requestedQuantity: 1,
        reason: 'Regular refill',
      });
      loadPrescriptions();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to request refill');
      console.error(err);
    }
  };

  const handleScheduleReminder = async (reminderData: any) => {
    try {
      await prescriptionService.scheduleReminder({
        prescriptionId: selectedPrescription?.id || '',
        medicationId: selectedPrescription?.medicationId || '',
        scheduledTime: reminderData.scheduledTime,
        reminderType: reminderData.reminderType,
        message: reminderData.message,
        repeatPattern: reminderData.repeatPattern,
      });
      handleCloseDialog();
    } catch (err) {
      setError('Failed to schedule reminder');
      console.error(err);
    }
  };

  const renderDialogContent = () => {
    switch (dialogType) {
      case 'add':
      case 'edit':
        return (
          <Box sx={{ p: 2 }}>
            <TextField
              fullWidth
              label="Medication Name"
              margin="normal"
              defaultValue={selectedPrescription?.medicationName}
            />
            <TextField
              fullWidth
              label="Dosage"
              margin="normal"
              defaultValue={selectedPrescription?.dosage}
            />
            <TextField
              fullWidth
              label="Frequency"
              margin="normal"
              defaultValue={selectedPrescription?.frequency}
            />
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              margin="normal"
              defaultValue={selectedPrescription?.startDate}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="End Date"
              type="date"
              margin="normal"
              defaultValue={selectedPrescription?.endDate}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        );
      case 'refill':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Request Refill</Typography>
            <Typography>
              Medication: {selectedPrescription?.medicationName}
            </Typography>
            <Typography>
              Refills Remaining: {selectedPrescription?.refillsRemaining}
            </Typography>
            <TextField
              fullWidth
              label="Reason"
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        );
      case 'reminder':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Schedule Reminder</Typography>
            <TextField
              fullWidth
              label="Scheduled Time"
              type="datetime-local"
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              select
              label="Reminder Type"
              margin="normal"
            >
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="push">Push Notification</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Message"
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              select
              label="Repeat Pattern"
              margin="normal"
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </TextField>
          </Box>
        );
      case 'interaction':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Medication Interactions</Typography>
            {interactions.map((interaction) => (
              <Alert
                key={interaction.id}
                severity={interaction.severity}
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle1">
                  {interaction.medications.join(' + ')}
                </Typography>
                <Typography>{interaction.description}</Typography>
                <Typography variant="subtitle2">Recommendations:</Typography>
                <ul>
                  {interaction.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </Alert>
            ))}
          </Box>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Prescriptions</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('add')}
              >
                Add Prescription
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Medication</TableCell>
                    <TableCell>Dosage</TableCell>
                    <TableCell>Frequency</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Refills</TableCell>
                    <TableCell>Next Refill</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prescriptions.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell>{prescription.medicationName}</TableCell>
                      <TableCell>{prescription.dosage}</TableCell>
                      <TableCell>{prescription.frequency}</TableCell>
                      <TableCell>
                        <Chip
                          label={prescription.status}
                          color={
                            prescription.status === 'active'
                              ? 'success'
                              : prescription.status === 'completed'
                              ? 'default'
                              : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>{prescription.refillsRemaining}</TableCell>
                      <TableCell>
                        {format(new Date(prescription.nextRefillDate), 'MM/dd/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit" TransitionComponent={Zoom}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('edit', prescription)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Request Refill" TransitionComponent={Zoom}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('refill', prescription)}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Schedule Reminder" TransitionComponent={Zoom}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('reminder', prescription)}
                          >
                            <NotificationsIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Check Interactions" TransitionComponent={Zoom}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog('interaction', prescription)}
                          >
                            <WarningIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Inventory Status
            </Typography>
            {inventory.map((item) => (
              <Box key={item.medicationId} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">{item.name}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={(item.quantity / item.reorderLevel) * 100}
                  color={item.quantity <= item.reorderLevel ? 'error' : 'success'}
                />
                <Typography variant="body2" color="text.secondary">
                  Quantity: {item.quantity} {item.unit}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Cost Analysis
            </Typography>
            {costs.map((cost) => (
              <Box key={cost.medicationId} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">{cost.name}</Typography>
                <Typography variant="body2">
                  Unit Price: ${cost.unitPrice}
                </Typography>
                <Typography variant="body2">
                  Insurance Coverage: ${cost.insuranceCoverage}
                </Typography>
                <Typography variant="body2">
                  Patient Cost: ${cost.patientCost}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'add'
            ? 'Add Prescription'
            : dialogType === 'edit'
            ? 'Edit Prescription'
            : dialogType === 'refill'
            ? 'Request Refill'
            : dialogType === 'reminder'
            ? 'Schedule Reminder'
            : 'Medication Interactions'}
        </DialogTitle>
        <DialogContent>{renderDialogContent()}</DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (dialogType === 'refill' && selectedPrescription) {
                handleRequestRefill(selectedPrescription.id);
              } else if (dialogType === 'reminder') {
                handleScheduleReminder({});
              } else {
                handleSavePrescription({});
              }
            }}
          >
            {dialogType === 'add'
              ? 'Add'
              : dialogType === 'edit'
              ? 'Save'
              : dialogType === 'refill'
              ? 'Request'
              : dialogType === 'reminder'
              ? 'Schedule'
              : 'Close'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PrescriptionManager; 