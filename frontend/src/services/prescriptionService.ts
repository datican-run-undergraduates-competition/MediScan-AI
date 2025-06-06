import axios from 'axios';
import { EventEmitter } from 'events';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

interface MedicationInteraction {
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  medications: string[];
  recommendations: string[];
  evidence: string;
  references: string[];
}

interface MedicationCost {
  medicationId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  insuranceCoverage: number;
  patientCost: number;
  pharmacy: string;
  lastUpdated: string;
}

interface InventoryItem {
  medicationId: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  lotNumber: string;
  supplier: string;
  reorderLevel: number;
  lastRestocked: string;
}

interface RefillRequest {
  id: string;
  prescriptionId: string;
  medicationId: string;
  requestedQuantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  processedAt?: string;
  reason: string;
  notes?: string;
}

interface MedicationReminder {
  id: string;
  prescriptionId: string;
  medicationId: string;
  scheduledTime: string;
  status: 'pending' | 'sent' | 'acknowledged' | 'missed';
  reminderType: 'email' | 'sms' | 'push';
  message: string;
  repeatPattern: string;
}

interface PrescriptionReport {
  id: string;
  type: 'adherence' | 'cost' | 'inventory' | 'interactions' | 'comprehensive';
  dateRange: {
    start: string;
    end: string;
  };
  data: any;
  generatedAt: string;
  format: 'pdf' | 'csv' | 'json';
}

class PrescriptionService extends EventEmitter {
  private static instance: PrescriptionService;

  private constructor() {
    super();
    this.setupWebSocket();
  }

  public static getInstance(): PrescriptionService {
    if (!PrescriptionService.instance) {
      PrescriptionService.instance = new PrescriptionService();
    }
    return PrescriptionService.instance;
  }

  private setupWebSocket() {
    // Setup WebSocket connection for real-time updates
    const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/prescriptions/ws`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit('prescriptionUpdate', data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  // Medication Interaction Checking
  async checkMedicationInteractions(medications: string[]): Promise<MedicationInteraction[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/prescriptions/interactions/check`, {
        medications
      });
      return response.data;
    } catch (error) {
      console.error('Error checking medication interactions:', error);
      throw error;
    }
  }

  async getInteractionDetails(interactionId: string): Promise<MedicationInteraction> {
    try {
      const response = await axios.get(`${API_BASE_URL}/prescriptions/interactions/${interactionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting interaction details:', error);
      throw error;
    }
  }

  // Prescription Refill Management
  async requestRefill(refillRequest: Omit<RefillRequest, 'id' | 'status' | 'requestedAt'>): Promise<RefillRequest> {
    try {
      const response = await axios.post(`${API_BASE_URL}/prescriptions/refills`, refillRequest);
      return response.data;
    } catch (error) {
      console.error('Error requesting refill:', error);
      throw error;
    }
  }

  async getRefillStatus(refillId: string): Promise<RefillRequest> {
    try {
      const response = await axios.get(`${API_BASE_URL}/prescriptions/refills/${refillId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting refill status:', error);
      throw error;
    }
  }

  async getRefillHistory(prescriptionId: string): Promise<RefillRequest[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/prescriptions/${prescriptionId}/refills`);
      return response.data;
    } catch (error) {
      console.error('Error getting refill history:', error);
      throw error;
    }
  }

  // Medication Reminder System
  async scheduleReminder(reminder: Omit<MedicationReminder, 'id' | 'status'>): Promise<MedicationReminder> {
    try {
      const response = await axios.post(`${API_BASE_URL}/prescriptions/reminders`, reminder);
      return response.data;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      throw error;
    }
  }

  async updateReminderStatus(reminderId: string, status: MedicationReminder['status']): Promise<MedicationReminder> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/prescriptions/reminders/${reminderId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating reminder status:', error);
      throw error;
    }
  }

  async getUpcomingReminders(prescriptionId: string): Promise<MedicationReminder[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/prescriptions/${prescriptionId}/reminders/upcoming`);
      return response.data;
    } catch (error) {
      console.error('Error getting upcoming reminders:', error);
      throw error;
    }
  }

  // Cost Tracking
  async getMedicationCosts(medicationIds: string[]): Promise<MedicationCost[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/prescriptions/costs`, { medicationIds });
      return response.data;
    } catch (error) {
      console.error('Error getting medication costs:', error);
      throw error;
    }
  }

  async getCostHistory(medicationId: string, dateRange: { start: string; end: string }): Promise<MedicationCost[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/prescriptions/costs/${medicationId}/history`, {
        params: dateRange
      });
      return response.data;
    } catch (error) {
      console.error('Error getting cost history:', error);
      throw error;
    }
  }

  // Inventory Management
  async getInventoryStatus(medicationIds: string[]): Promise<InventoryItem[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/prescriptions/inventory/status`, { medicationIds });
      return response.data;
    } catch (error) {
      console.error('Error getting inventory status:', error);
      throw error;
    }
  }

  async updateInventory(updates: Array<{ medicationId: string; quantity: number }>): Promise<InventoryItem[]> {
    try {
      const response = await axios.patch(`${API_BASE_URL}/prescriptions/inventory`, { updates });
      return response.data;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }

  async getLowStockAlerts(): Promise<InventoryItem[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/prescriptions/inventory/alerts`);
      return response.data;
    } catch (error) {
      console.error('Error getting low stock alerts:', error);
      throw error;
    }
  }

  // Reporting
  async generateReport(reportParams: Omit<PrescriptionReport, 'id' | 'generatedAt'>): Promise<PrescriptionReport> {
    try {
      const response = await axios.post(`${API_BASE_URL}/prescriptions/reports`, reportParams);
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  async getReport(reportId: string): Promise<PrescriptionReport> {
    try {
      const response = await axios.get(`${API_BASE_URL}/prescriptions/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting report:', error);
      throw error;
    }
  }

  async downloadReport(reportId: string, format: PrescriptionReport['format']): Promise<Blob> {
    try {
      const response = await axios.get(`${API_BASE_URL}/prescriptions/reports/${reportId}/download`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  // Event Handlers
  onInteractionAlert(callback: (interaction: MedicationInteraction) => void) {
    this.on('interactionAlert', callback);
  }

  onReminderDue(callback: (reminder: MedicationReminder) => void) {
    this.on('reminderDue', callback);
  }

  onLowStockAlert(callback: (item: InventoryItem) => void) {
    this.on('lowStockAlert', callback);
  }

  onRefillStatusUpdate(callback: (refill: RefillRequest) => void) {
    this.on('refillStatusUpdate', callback);
  }

  onCostUpdate(callback: (cost: MedicationCost) => void) {
    this.on('costUpdate', callback);
  }
}

export const prescriptionService = PrescriptionService.getInstance(); 