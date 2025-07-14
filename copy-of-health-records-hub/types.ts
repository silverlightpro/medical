
export enum RecordType {
  CareSummary = "Care Summary",
  HospitalVisit = "Hospital Visit",
  LabResult = "Lab Result",
  DoctorNote = "Doctor's Note",
  Prescription = "Prescription",
  Imaging = "Imaging",
  Other = "Other",
}

export interface Patient {
  id: string; // UUID
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  sex?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    email?: string;
  };
  stats?: {
    height?: string;
    heightUnit?: 'in' | 'cm';
    weight?: string;
    weightUnit?: 'lbs' | 'kg';
    bloodType?: string;
  };
  createdAt: string; // ISO date string
}

export interface MedicalRecord {
  id: string; // UUID
  patientId: string;
  fileName: string;
  fileDataUrl?: string; // Store PDF as data URL
  extractedText?: string; 
  geminiSummary?: string; 
  recordDate: string; // YYYY-MM-DD
  procedureDate?: string; // YYYY-MM-DD
  recordType: RecordType;
  title: string; 
  details: string; 
  extractedDiagnoses?: string[];
  extractedProcedures?: string[];
  extractedKeyFindings?: string[];
  associatedIssueIds?: string[];
  createdAt: string; // ISO date string
}

export type MetricCategory =
  | "Vital Signs"
  | "General Observations"
  | "Measurements"
  | "Lab Results - CBC"
  | "Lab Results - BMP"
  | "Lab Results - CMP"
  | "Lab Results - Lipids"
  | "Lab Results - Coagulation"
  | "Lab Results - Cardiac"
  | "Lab Results - Urinalysis"
  | "Lab Results - Blood Gas"
  | "Lab Results - Specialized" // Thyroid, Inflammatory, Cultures, etc.
  | "Pulmonary Function"
  | "Imaging Findings" // For quantifiable results from imaging like Ejection Fraction
  | "Other";


export interface HealthMetric {
  id: string; // UUID
  patientId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  name: string; // e.g., "Heart Rate", "Blood Glucose", "WBC Count"
  value: string; // The value of the metric. Keep as string for flexibility (e.g., "120/80")
  unit: string; // e.g., "bpm", "mg/dL", "x10^9/L"
  category: MetricCategory;
  notes?: string;
  associatedIssueIds?: string[];
  createdAt: string; // ISO date string
  explanation?: string; // Cache for GeminiMetricExplanation (JSON string)
}

export interface HealthIssue {
  id: string; // UUID
  patientId: string;
  name: string;
  startDate?: string; // YYYY-MM-DD
  status: 'Active' | 'Resolved' | 'Monitoring';
  description?: string;
  createdAt: string; // ISO date string
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  records: MedicalRecord[];
  metrics: HealthMetric[];
}

// For Gemini response parsing
export interface GeminiExtractedRecordInfo {
  suggestedTitle: string | null;
  summary: string | null;
  diagnoses: string[] | null;
  procedures: string[] | null;
  keyFindings: string[] | null;
  recordTypeSuggestion: string | null;
}

export interface GeminiExtractedMetric {
    name: string;
    value: string;
    unit: string;
    category: MetricCategory;
}

export interface GeminiDailyData {
    date: string; // YYYY-MM-DD
    recordInfo: GeminiExtractedRecordInfo;
    metrics: GeminiExtractedMetric[];
}

export type GeminiExtractedData = GeminiDailyData[];

// For Metric Detail Page
export interface GeminiMetricExplanation {
    description: string;
    normalRange: string;
    causesForDeviation: string;
    improvementPlan: string;
    patientSpecificImpact: string;
}

// For AI Chat
export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

// For passing full context to AI
export interface HealthProfile {
    patient: Patient | null;
    records: MedicalRecord[];
    metrics: HealthMetric[];
    issues: HealthIssue[];
}

// For Health Insights
export interface GeminiHealthInsights {
    overallSummary: string;
    notableTrends: string[];
    potentialConnections: string[];
    questionsForDoctor: string[];
}

// For Sharing
export interface ShareComment {
  id: string;
  sharedRecordId: string;
  author: 'sender' | 'recipient';
  text: string;
  createdAt: string;
}

export interface SharedRecord {
  accessKey: string; // The unique ID for the URL
  recordId: string;
  patientId: string;
  createdAt: string;
}

// For Alerts
export type AlertLevel = 'Critical' | 'Warning' | 'Info';
export type AlertStatus = 'new' | 'dismissed';
export interface Alert {
    id: string;
    patientId: string;
    level: AlertLevel;
    status: AlertStatus;
    title: string;
    message: string;
    date: string; // ISO date string
    linkTo?: {
        view: 'metricDetail';
        metricId: string;
    } | {
        view: 'recordDetail';
        recordId: string;
    };
}

// For AI Record Review
export interface GeminiFinding {
    observation: string;
    context: string;
    assessment: string;
    potentialConcernLevel: 'Normal' | 'Moderate' | 'High';
    reasoning: string;
}

export interface GeminiIndividualRecordFinding {
    recordId: string;
    recordTitle: string;
    findings: GeminiFinding[];
}

export interface GeminiCrossRecordConnection {
    observation: string;
    implication: string;
    recommendation: string;
}

export interface GeminiReviewResult {
    overallAssessment: string;
    individualRecordFindings: GeminiIndividualRecordFinding[];
    crossRecordConnections: GeminiCrossRecordConnection[];
    questionsForDoctor: string[];
}
