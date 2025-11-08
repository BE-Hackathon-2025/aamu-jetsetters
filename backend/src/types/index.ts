export type ChemicalParameter = 
  | 'chlorine'
  | 'pH'
  | 'turbidity'
  | 'temperature'
  | 'lead';

export type ParameterStatus = 'normal' | 'warning' | 'anomaly';

export type OverallRiskLevel = 
  | 'stable'
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical';

export interface ChemicalReading {
  parameter: ChemicalParameter;
  value: number;
  unit: string;
  status: ParameterStatus;
  timestamp: Date;
  note?: string;
}

export interface WaterRiskIndex {
  index: number;
  level: OverallRiskLevel;
  timestamp: Date;
  description: string;
}

export interface PublicStatusResponse {
  overallRisk: WaterRiskIndex;
  chemicals: ChemicalReading[];
  healthAdvisory: HealthAdvisory;
  lastUpdated: Date;
}

export interface HealthAdvisory {
  message: string;
  instructions: string;
  updatedAt: Date;
}

export interface AnomalyContext {
  isActive: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type?: 'chemical' | 'network' | 'physical' | 'cyber';
  affectedParameters?: ChemicalParameter[];
  startTime?: Date;
}

export interface TimeSeriesPoint {
  timestamp: Date;
  chemicals: ChemicalReading[];
  riskIndex: number;
  anomalyContext: AnomalyContext;
}

export interface AttackScenario {
  id: string;
  name: string;
  type: 'chemical' | 'network' | 'physical';
  duration: number;
  effects: {
    parameter: ChemicalParameter;
    targetValue: number;
    progressionRate: number;
  }[];
}

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type IssueStatus = 'new' | 'acknowledged' | 'resolved';

export interface CommunityIssue {
  id: number;
  issueType: string;
  description: string;
  location: string;
  priority: IssuePriority;
  contactEmail?: string;
  contactPhone?: string;
  status: IssueStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitIssueRequest {
  issueType: string;
  description: string;
  location: string;
  priority: IssuePriority;
  contactEmail?: string;
  contactPhone?: string;
}

