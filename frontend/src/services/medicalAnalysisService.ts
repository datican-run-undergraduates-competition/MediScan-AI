import axios from 'axios';
import { EventEmitter } from 'events';
import { API_BASE_URL } from '../config';

export interface AnalysisRequest {
  patient_data: Record<string, any>;
  scan_data: Record<string, any>;
  lab_results?: Record<string, any>;
  clinical_notes?: Record<string, any>;
}

export interface PatternMatch {
  condition: string;
  description: string;
  confidence_factors: Record<string, number>;
  matched_patterns: string[];
  temporal_factors: Record<string, number>;
  progression_score: number;
  rarity_score: number;
  severity_level: 'mild' | 'moderate' | 'severe';
  recommended_actions: string[];
}

export interface PrimaryDiagnosis {
  condition: string;
  confidence: number;
  severity: string;
  urgency_level: string;
}

export interface DifferentialDiagnosis {
  condition: string;
  confidence: number;
}

export interface AnalysisResult {
  scan_id: string;
  timestamp: string;
  pattern_matches: PatternMatch[];
  overall_confidence: number;
  quality_metrics: {
    image_quality: number;
    analysis_quality: number;
    confidence_threshold: number;
  };
  metadata: {
    modality: string;
    body_region: string;
    patient_age: number;
    patient_gender: string;
  };
}

export interface TemporalAnalysis {
  progression_rate: number;
  stability_score: number;
  trend_direction: 'improving' | 'stable' | 'worsening';
  key_milestones: Array<{
    timestamp: string;
    event: string;
    significance: number;
  }>;
}

export interface ProgressionAnalysis {
  current_stage: string;
  stage_progression: number;
  risk_factors: Array<{
    factor: string;
    impact: number;
    mitigation: string;
  }>;
  predicted_trajectory: Array<{
    timeframe: string;
    expected_state: string;
    confidence: number;
  }>;
}

export interface AnalysisResponse {
  success: boolean;
  data: AnalysisResult;
  message: string;
}

export class MedicalAnalysisService extends EventEmitter {
  private ws: WebSocket | null = null;

  constructor() {
    super();
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    this.ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/analysis/updates`);
    this.ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      this.emit('analysisUpdate', update);
    };
  }

  async analyzeMedicalCase(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const response = await axios.post<AnalysisResponse>(
        `${API_BASE_URL}/medical-analysis/analyze`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error analyzing medical case:', error);
      throw error;
    }
  }

  async getMedicalConditions(): Promise<Record<string, any>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/medical-analysis/conditions`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching medical conditions:', error);
      throw error;
    }
  }

  // Helper methods for data preparation
  preparePatientData(data: Record<string, any>): Record<string, any> {
    return {
      medical_history: data.medicalHistory || [],
      surgical_history: data.surgicalHistory || [],
      family_history: data.familyHistory || {},
      medications: data.medications || [],
      allergies: data.allergies || [],
      social_history: data.socialHistory || {}
    };
  }

  prepareScanData(data: Record<string, any>): Record<string, any> {
    return {
      modality: data.modality,
      findings: data.findings || [],
      measurements: data.measurements || {},
      quality_metrics: data.qualityMetrics || {},
      comparison: data.comparison || {},
      technical_parameters: data.technicalParameters || {}
    };
  }

  prepareLabData(data: Record<string, any>): Record<string, any> {
    return {
      blood_tests: data.bloodTests || {},
      urine_tests: data.urineTests || {},
      microbiology: data.microbiology || {},
      pathology: data.pathology || {},
      genetic_tests: data.geneticTests || {}
    };
  }

  prepareClinicalNotes(data: Record<string, any>): Record<string, any> {
    return {
      symptoms: data.symptoms || [],
      vital_signs: data.vitalSigns || {},
      physical_exam: data.physicalExam || {},
      medications: data.medications || [],
      allergies: data.allergies || [],
      social_history: data.socialHistory || {}
    };
  }

  async analyzeScan(scanId: string): Promise<AnalysisResult> {
    try {
      const response = await axios.get(`${API_BASE_URL}/analysis/${scanId}`);
      return response.data;
    } catch (error) {
      console.error('Error analyzing scan:', error);
      throw error;
    }
  }

  async getTemporalAnalysis(scanId: string): Promise<TemporalAnalysis> {
    try {
      const response = await axios.get(`${API_BASE_URL}/analysis/${scanId}/temporal`);
      return response.data;
    } catch (error) {
      console.error('Error getting temporal analysis:', error);
      throw error;
    }
  }

  async getProgressionAnalysis(scanId: string): Promise<ProgressionAnalysis> {
    try {
      const response = await axios.get(`${API_BASE_URL}/analysis/${scanId}/progression`);
      return response.data;
    } catch (error) {
      console.error('Error getting progression analysis:', error);
      throw error;
    }
  }

  async compareScans(scanIds: string[]): Promise<{
    comparison: Record<string, any>;
    trends: Array<{
      metric: string;
      values: number[];
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
  }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/analysis/compare`, { scanIds });
      return response.data;
    } catch (error) {
      console.error('Error comparing scans:', error);
      throw error;
    }
  }

  async exportAnalysis(scanId: string, format: 'pdf' | 'json' | 'csv'): Promise<Blob> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/analysis/${scanId}/export`,
        {
          params: { format },
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting analysis:', error);
      throw error;
    }
  }

  async getRarityScore(condition: string): Promise<number> {
    try {
      const response = await axios.get(`${API_BASE_URL}/analysis/rarity/${condition}`);
      return response.data.rarity_score;
    } catch (error) {
      console.error('Error getting rarity score:', error);
      throw error;
    }
  }

  cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const medicalAnalysisService = new MedicalAnalysisService(); 