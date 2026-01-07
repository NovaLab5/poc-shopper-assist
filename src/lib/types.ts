export type AIOption = {
  id: string;
  shortAnswer: string;
  longAnswer: string;
};

export type AIQuestion = {
  id: string;
  question: string;
  options: AIOption[];
  basedOn?: string[]; // Signals that inform this question
};

export type AIInterpretation = {
  audience: string;
  goal: string;
  location: string;
  priority: string;
  category: 'Grill' | 'Skechers';
  categoryReasoning: string;
  setupStyle?: string;      // For Grill
  comfortFeature?: string;  // For Skechers
  finalPriority: string;
  brandSensitive: boolean;
  brandSensitivityLabel: string;
  brands: string[];
  priceRange: string;
  notes?: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: 'Grill' | 'Skechers';
  tags: string[];
  price: number;
  amazonUrl: string;
  imageUrl?: string;
  aiRecommendation?: string;
};

export type SelectedAnswer = {
  questionId: string;
  question: string;
  shortAnswer: string;
  longAnswer: string;
  timestamp: number;
};

export type Session = {
  id: string;
  startedAt: number;
  completedAt?: number;
  answers: SelectedAnswer[];
  interpretation?: AIInterpretation;
  recommendedProductIds?: string[];
};

export type AppState = {
  sessions: Session[];
};

// Profile built from answers Q1-Q4
export type ShopperProfile = {
  audience: string;
  goal: string;
  location: string;
  priority: string;
  grillScore: number;
  skechersScore: number;
};
