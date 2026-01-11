
export interface ReadingFeedback {
  pronunciationScore: number;
  intonationScore: number;
  fluencyScore: number;
  mistakes: string[];
  tips: string[];
  readingTimeSeconds: number;
  // New fields for dynamic analysis
  difficultyLevel: string;
  grammarAnalysis: string;
  estimatedTimeSeconds: number;
}

export interface SessionState {
  status: 'idle' | 'listening_to_model' | 'user_reading' | 'analyzing' | 'completed';
  text: string;
}

export enum AppStep {
  ENTRY = 'ENTRY',
  PRACTICE = 'PRACTICE',
  FEEDBACK = 'FEEDBACK'
}

export interface VoiceOption {
  id: string;
  name: string;
  accent: 'US' | 'UK';
  voiceName: string;
}

// Fixed voice names based on observed genders
export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'us-1', name: 'Emma (Warm)', accent: 'US', voiceName: 'Kore' },
  { id: 'us-2', name: 'Sarah (Friendly)', accent: 'US', voiceName: 'Zephyr' },
  { id: 'uk-1', name: 'Arthur (Crisp)', accent: 'UK', voiceName: 'Puck' },
  { id: 'uk-2', name: 'Oliver (Gentle)', accent: 'UK', voiceName: 'Charon' },
];
