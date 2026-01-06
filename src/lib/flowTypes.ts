// Types for JSON-driven shopping flow

export interface FlowProduct {
  name: string;
  price: number;
  currency: string;
  url: string;
  image?: string;
}

export interface FlowPreference {
  question: string;
  options: string[];
}

export interface BudgetOption {
  label: string;
  min: number;
  max: number | null;
  currency: string;
}

export interface FlowQuestion {
  key: string;
  question: string;
  type: 'number' | 'text' | 'select' | 'single_select' | 'slider';
  options?: string[] | BudgetOption[];
}

export interface FlowResults {
  [retailer: string]: FlowProduct[];
}

export interface FlowSubcategory {
  label?: string;
  preferences?: FlowPreference;
  results?: FlowResults;
}

export interface FlowCategory {
  label?: string;
  subcategories?: string[] | { [key: string]: FlowSubcategory };
  options?: { [key: string]: FlowSubcategory };
}

export interface FlowRecipients {
  [key: string]: Record<string, never> | string[];
}

export interface FlowEntryNode {
  recipients?: FlowRecipients;
  questions?: FlowQuestion[];
  categories?: { [key: string]: FlowCategory };
  forWhom?: FlowPreference;
  age?: { question: string; type: string };
}

export interface UserFlow {
  entryPoints: string[];
  [key: string]: FlowEntryNode | string[];
}

export interface FlowData {
  userFlow: UserFlow;
}

// Navigation state types
export type FlowStep =
  | 'entry'
  | 'questions'
  | 'recipients'
  | 'loading_recipient_info'
  | 'loading_ai_thinking'
  | 'loading_interests_check'
  | 'loading_categories'
  | 'categories'
  | 'loading_subcategories'
  | 'subcategories'
  | 'loading_results'
  | 'preferences'
  | 'results';

export interface FlowState {
  currentStep: FlowStep;
  entryPoint: string | null;
  recipient: string | null;
  category: string | null;
  subcategory: string | null;
  preference: string | null;
  questionAnswers: { [key: string]: string | number };
  stepHistory: FlowStep[];
  totalSteps: number;
  currentStepNumber: number;
  currentQuestionIndex: number;
}

export interface FlowSession {
  id: string;
  timestamp: number;
  state: FlowState;
  results?: FlowResults;
}

// Helper to format display labels from keys
export function formatLabel(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to get label from option (handles both string and BudgetOption)
export function getOptionLabel(option: string | BudgetOption): string {
  if (typeof option === 'string') {
    return formatLabel(option);
  }
  return option.label;
}

// Helper to get option value for storage
export function getOptionValue(option: string | BudgetOption): string {
  if (typeof option === 'string') {
    return option;
  }
  return option.label;
}
