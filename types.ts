
export type ControlType = 'slider' | 'button' | 'select' | 'toggle';

export interface SimulationControl {
  id: string;
  type: ControlType;
  label: string;
  defaultValue?: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // For select inputs
}

export interface GeneratedSimulation {
  title: string;
  description: string;
  instructions: string;
  code: string; // The HTML/JS source code
  controls: SimulationControl[]; // List of controls to render externally
}

export interface HistoryItem {
  id: number;
  created_at: string;
  title: string;
  prompt: string;
  simulation_data: GeneratedSimulation;
  user_id?: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface SimulationRequest {
  prompt: string;
}

// ChatBot Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// AI Model Types
export type AIModelId = 'gemini-flash' | 'claude-sonnet' | 'gpt-4o' | 'llama-3';

export interface AIModel {
  id: AIModelId;
  name: string;
  provider: string;
  description: string;
  color: string;
}

export type Page = 'home' | 'about' | 'terms' | '3d' | 'community';
