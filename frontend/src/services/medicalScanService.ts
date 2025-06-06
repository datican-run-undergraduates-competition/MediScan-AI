import axios from 'axios';
import { API_BASE_URL } from '../config';
import { EventEmitter } from 'events';

export interface ScanMetadata {
  id: string;
  patientId: string;
  scanType: string;
  modality: 'x-ray' | 'mri' | 'ct' | 'ultrasound';
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confidence: number;
  findings: ScanFinding[];
  measurements: ScanMeasurement[];
  qualityMetrics: QualityMetrics;
  annotations?: ScanAnnotation[];
  comparisonData?: ComparisonData;
  aiInsights?: AIInsight[];
}

export interface ScanFinding {
  id: string;
  type: string;
  confidence: number;
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  recommendations: string[];
  relatedFindings?: string[];
  followUpRequired?: boolean;
  followUpDate?: string;
}

export interface ScanMeasurement {
  type: 'area' | 'linear' | 'density' | 'count';
  value: number;
  unit: string;
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  referenceRange?: {
    min: number;
    max: number;
    unit: string;
  };
  trend?: 'increasing' | 'decreasing' | 'stable';
}

export interface QualityMetrics {
  contrast: number;
  noise: number;
  sharpness: number;
  brightness: number;
  overall: number;
  artifacts?: number;
  resolution?: number;
  signalToNoiseRatio?: number;
}

export interface ScanAnnotation {
  id: string;
  type: 'text' | 'arrow' | 'circle' | 'rectangle';
  content: string;
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color: string;
  author: string;
  timestamp: string;
}

export interface ComparisonData {
  previousScanId: string;
  changes: {
    type: 'new' | 'resolved' | 'changed';
    findingId: string;
    description: string;
  }[];
  similarity: number;
  significantChanges: boolean;
}

export interface AIInsight {
  type: 'finding' | 'recommendation' | 'risk';
  content: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  references?: string[];
}

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  message?: string;
  stage?: 'preprocessing' | 'analysis' | 'ai_review' | 'finalizing';
}

export interface BatchUploadResult {
  success: ScanMetadata[];
  failed: { file: File; error: string }[];
  warnings: { file: File; message: string }[];
}

export interface RealTimeUpdate {
  type: 'progress' | 'status' | 'finding' | 'measurement' | 'quality' | 'ai_insight';
  scanId: string;
  data: any;
  timestamp: string;
}

export interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  allergies: string[];
  currentMedications: string[];
  medicalHistory: string[];
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
  };
}

export interface Prescription {
  id: string;
  patientId: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    specialInstructions: string[];
  }>;
  warnings: string[];
  interactions: Array<{
    severity: number;
    description: string;
  }>;
  contraindications: Array<{
    severity: number;
    description: string;
  }>;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

class MedicalScanService extends EventEmitter {
  private readonly baseUrl = `${API_BASE_URL}/api/medical-scans`;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageQueue: RealTimeUpdate[] = [];
  private isProcessingQueue = false;

  constructor() {
    super();
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/ws/scans`);
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.processMessageQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const update: RealTimeUpdate = JSON.parse(event.data);
        this.emit('update', update);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectTimeout = setTimeout(() => this.initializeWebSocket(), delay);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.ws?.close();
    };
  }

  private processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return;

    this.isProcessingQueue = true;
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.emit('update', message);
      }
    }
    this.isProcessingQueue = false;
  }

  private queueMessage(update: RealTimeUpdate) {
    this.messageQueue.push(update);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.processMessageQueue();
    }
  }

  async uploadScan(
    file: File,
    metadata: Partial<ScanMetadata>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ScanMetadata> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    try {
      const response = await axios.post(this.baseUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            onProgress({
              progress: Math.round((progressEvent.loaded * 100) / progressEvent.total!),
              status: 'uploading',
              stage: 'preprocessing',
            });
          }
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async batchUpload(
    files: File[],
    metadata: Partial<ScanMetadata>[],
    onProgress?: (progress: { total: number; completed: number; failed: number; warnings: number }) => void
  ): Promise<BatchUploadResult> {
    const results: BatchUploadResult = {
      success: [],
      failed: [],
      warnings: [],
    };

    const total = files.length;
    let completed = 0;
    let failed = 0;
    let warnings = 0;

    const uploadPromises = files.map(async (file, index) => {
      try {
        const result = await this.uploadScan(file, metadata[index]);
        
        // Check for warnings
        if (result.qualityMetrics.overall < 60) {
          results.warnings.push({
            file,
            message: 'Low quality scan detected',
          });
          warnings++;
        }

        results.success.push(result);
        completed++;
      } catch (error) {
        results.failed.push({
          file,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
        failed++;
      }

      if (onProgress) {
        onProgress({ total, completed, failed, warnings });
      }
    });

    await Promise.all(uploadPromises);
    return results;
  }

  async getScan(scanId: string): Promise<ScanMetadata> {
    try {
      const response = await axios.get(`${this.baseUrl}/${scanId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getScanImage(
    scanId: string,
    format: 'original' | 'processed' | 'overlay' = 'processed',
    options?: {
      contrast?: number;
      brightness?: number;
      annotations?: boolean;
      measurements?: boolean;
    }
  ): Promise<Blob> {
    try {
      const response = await axios.get(`${this.baseUrl}/${scanId}/image`, {
        params: { format, ...options },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getScanAnalysis(
    scanId: string,
    options?: {
      includeAIInsights?: boolean;
      includeComparison?: boolean;
      includeAnnotations?: boolean;
    }
  ): Promise<{
    findings: ScanFinding[];
    measurements: ScanMeasurement[];
    qualityMetrics: QualityMetrics;
    aiInsights?: AIInsight[];
    comparisonData?: ComparisonData;
    annotations?: ScanAnnotation[];
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/${scanId}/analysis`, {
        params: options,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getScanHistory(
    patientId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      modality?: string;
      limit?: number;
      offset?: number;
      includeAnalysis?: boolean;
    }
  ): Promise<{
    scans: ScanMetadata[];
    total: number;
    trends?: {
      [key: string]: {
        values: number[];
        dates: string[];
      };
    };
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/patient/${patientId}/history`, {
        params: options,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async compareScans(
    scanId1: string,
    scanId2: string,
    options?: {
      overlay?: boolean;
      highlightDifferences?: boolean;
      includeMeasurements?: boolean;
      includeFindings?: boolean;
    }
  ): Promise<{
    differences: ScanFinding[];
    measurements: ScanMeasurement[];
    similarity: number;
    overlayImage?: Blob;
    changeMap?: {
      [key: string]: {
        before: number;
        after: number;
        change: number;
      };
    };
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/compare`, {
        params: { scanId1, scanId2, ...options },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async exportReport(
    scanId: string,
    format: 'pdf' | 'dicom' | 'csv' | 'json',
    options?: {
      includeImages?: boolean;
      includeMeasurements?: boolean;
      includeFindings?: boolean;
      includeAIInsights?: boolean;
      language?: string;
      template?: string;
    }
  ): Promise<Blob> {
    try {
      const response = await axios.get(`${this.baseUrl}/${scanId}/export`, {
        params: { format, ...options },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAuditLog(
    scanId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      action?: string;
      userId?: string;
      includeDetails?: boolean;
    }
  ): Promise<{
    logs: Array<{
      timestamp: string;
      action: string;
      userId: string;
      details: any;
      changes?: {
        field: string;
        oldValue: any;
        newValue: any;
      }[];
    }>;
    total: number;
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/${scanId}/audit`, {
        params: options,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPatientData(patientId: string): Promise<PatientData> {
    try {
      const response = await axios.get(`${this.baseUrl}/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPrescriptions(patientId: string): Promise<Prescription[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/patients/${patientId}/prescriptions`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async generatePrescription(data: {
    patientData: PatientData;
    diagnosis: string;
  }): Promise<Prescription> {
    try {
      const response = await axios.post(`${this.baseUrl}/prescriptions/generate`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updatePrescription(
    prescriptionId: string,
    updates: Partial<Prescription>
  ): Promise<Prescription> {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/prescriptions/${prescriptionId}`,
        updates
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async cancelPrescription(prescriptionId: string): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/prescriptions/${prescriptionId}/cancel`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDrugInteractions(medications: string[]): Promise<Array<{
    severity: number;
    description: string;
  }>> {
    try {
      const response = await axios.post(`${this.baseUrl}/prescriptions/check-interactions`, {
        medications,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getContraindications(
    patientData: PatientData,
    medications: string[]
  ): Promise<Array<{
    severity: number;
    description: string;
  }>> {
    try {
      const response = await axios.post(`${this.baseUrl}/prescriptions/check-contraindications`, {
        patientData,
        medications,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || 'An error occurred';
      const code = error.response?.data?.code || 'UNKNOWN_ERROR';
      const details = error.response?.data?.details || {};
      
      const enhancedError = new Error(message);
      (enhancedError as any).code = code;
      (enhancedError as any).details = details;
      
      return enhancedError;
    }
    return error;
  }

  cleanup() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const medicalScanService = new MedicalScanService(); 