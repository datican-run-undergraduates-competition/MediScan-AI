export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  department: string;
}

export interface UserSettings {
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  analysis_complete: boolean;
  new_reports: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark';
  font_size: 'small' | 'medium' | 'large';
  contrast: 'normal' | 'high';
}

export interface PrivacySettings {
  share_analysis: boolean;
  share_reports: boolean;
  data_retention: number;
}

export interface AnalysisResponse {
  id: number;
  file_type: 'xray' | 'mri' | 'ct';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: {
    findings: string[];
    confidence: number;
    recommendations: string[];
    primary_diagnosis: {
      condition: string;
      confidence: number;
      severity: string;
      urgency_level: string;
    };
    differential_diagnoses: Array<{
      condition: string;
      confidence: number;
    }>;
    key_findings: string[];
    recommended_tests: string[];
    pattern_matches: Array<{
      condition: string;
      description: string;
      confidence_factors: Record<string, number>;
      matched_patterns: string[];
      temporal_factors: Record<string, number>;
      progression_score: number;
      rarity_score: number;
      severity_level: 'mild' | 'moderate' | 'severe';
      recommended_actions: string[];
    }>;
  };
  created_at: string;
}

export interface DashboardStats {
  total_analyses: number;
  recent_analyses: AnalysisResponse[];
  pending_analyses: number;
  completed_analyses: number;
  failed_analyses: number;
}

export interface Upload {
  id: number;
  file_name: string;
  file_type: string;
  status: string;
  created_at: string;
  analysis?: AnalysisResponse;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

export interface VoiceCommand {
  id: string;
  command: string;
  response: string;
  timestamp: string;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
}

export interface VoiceResponse {
  response: string;
  action?: string;
  data?: any;
} 