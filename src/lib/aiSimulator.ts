import { AIQuestion, AIInterpretation, SelectedAnswer, ShopperProfile } from './types';
import { products } from './products';

// =========================================
// Q1 - Fixed first question (Audience)
// =========================================
const Q1_AUDIENCE: AIQuestion = {
  id: 'q1',
  question: 'Are you shopping for yourself, family, friend, or just browsing?',
  options: [
    { id: 'q1-a', shortAnswer: 'Me', longAnswer: 'I am shopping for myself.' },
    { id: 'q1-b', shortAnswer: 'Friend', longAnswer: 'I am shopping for a friend.' },
    { id: 'q1-c', shortAnswer: 'Family', longAnswer: 'I am shopping for my family.' },
    { id: 'q1-d', shortAnswer: 'Window shopping', longAnswer: 'I am just browsing / window shopping.' },
  ],
};

export const FIRST_QUESTION = Q1_AUDIENCE;

// =========================================
// Helper: Build profile from answers
// =========================================
function buildProfile(answers: SelectedAnswer[]): ShopperProfile {
  const getAnswer = (qId: string) => answers.find(a => a.questionId === qId)?.shortAnswer || '';
  
  const audience = getAnswer('q1');
  const goal = getAnswer('q2');
  const location = getAnswer('q3');
  const priority = getAnswer('q4');
  
  // Scoring for category inference
  let grillScore = 0;
  let skechersScore = 0;
  
  // Q2: Goal scoring
  const goalLower = goal.toLowerCase();
  if (goalLower.includes('cooking') || goalLower.includes('hosting')) {
    grillScore += 3;
  } else if (goalLower.includes('walking') || goalLower.includes('comfort')) {
    skechersScore += 3;
  } else if (goalLower.includes('exploring')) {
    grillScore += 1;
    skechersScore += 1;
  }
  
  // Q3: Location scoring
  const locationLower = location.toLowerCase();
  if (locationLower.includes('backyard') || locationLower.includes('outdoors') || locationLower.includes('patio')) {
    grillScore += 3;
  } else if (locationLower.includes('travel') || locationLower.includes('walking') || locationLower.includes('work') || locationLower.includes('standing')) {
    skechersScore += 3;
  } else if (locationLower.includes('home')) {
    grillScore += 1;
    skechersScore += 1;
  }
  
  // Q4: Priority scoring
  const priorityLower = priority.toLowerCase();
  if (priorityLower.includes('power') || priorityLower.includes('performance')) {
    grillScore += 2;
  } else if (priorityLower.includes('comfort') || priorityLower.includes('support')) {
    skechersScore += 2;
  } else if (priorityLower.includes('convenience') || priorityLower.includes('effort')) {
    grillScore += 1;
    skechersScore += 1;
  } else if (priorityLower.includes('trusted') || priorityLower.includes('popular')) {
    grillScore += 1;
    skechersScore += 1;
  }
  
  return { audience, goal, location, priority, grillScore, skechersScore };
}

// =========================================
// Dynamic Question Generation
// =========================================
function generateQ2(answers: SelectedAnswer[]): AIQuestion {
  const audience = answers.find(a => a.questionId === 'q1')?.shortAnswer || 'yourself';
  const audienceLabel = audience === 'Me' ? 'yourself' : 
                        audience === 'Friend' ? 'a friend' : 
                        audience === 'Family' ? 'your family' : 'yourself';
  
  return {
    id: 'q2',
    question: `Got it — shopping for ${audienceLabel}. What are you hoping to make better today?`,
    basedOn: [audience],
    options: [
      { id: 'q2-a', shortAnswer: 'Cooking easier', longAnswer: 'I want to make cooking and grilling easier and more enjoyable.' },
      { id: 'q2-b', shortAnswer: 'Comfort walking/standing', longAnswer: 'I want more comfort when walking or standing.' },
      { id: 'q2-c', shortAnswer: 'Hosting guests', longAnswer: 'I want to improve hosting gatherings and entertaining guests.' },
      { id: 'q2-d', shortAnswer: 'Exploring', longAnswer: 'I am just exploring options and ideas.' },
    ],
  };
}

function generateQ3(answers: SelectedAnswer[]): AIQuestion {
  const audience = answers.find(a => a.questionId === 'q1')?.shortAnswer || 'yourself';
  const goal = answers.find(a => a.questionId === 'q2')?.shortAnswer || 'improve things';
  
  const audienceLabel = audience === 'Me' ? 'yourself' : 
                        audience === 'Friend' ? 'a friend' : 
                        audience === 'Family' ? 'your family' : 'yourself';
  
  return {
    id: 'q3',
    question: `Because you're shopping for ${audienceLabel} and want "${goal.toLowerCase()}", where will you use it most?`,
    basedOn: [audience, goal],
    options: [
      { id: 'q3-a', shortAnswer: 'Backyard / Outdoors', longAnswer: 'Primarily in the backyard, patio, or outdoors.' },
      { id: 'q3-b', shortAnswer: 'Traveling / Walking', longAnswer: 'While traveling or walking around.' },
      { id: 'q3-c', shortAnswer: 'Work / Standing', longAnswer: 'At work or while standing for long periods.' },
      { id: 'q3-d', shortAnswer: 'Mostly at home', longAnswer: 'Mostly at home for daily use.' },
    ],
  };
}

function generateQ4(answers: SelectedAnswer[]): AIQuestion {
  const profile = buildProfile(answers);
  
  return {
    id: 'q4',
    question: 'Based on that, what matters most right now?',
    basedOn: [profile.goal, profile.location].filter(Boolean),
    options: [
      { id: 'q4-a', shortAnswer: 'Power & Performance', longAnswer: 'I prioritize power and maximum performance.' },
      { id: 'q4-b', shortAnswer: 'Convenience & Low effort', longAnswer: 'I prioritize convenience and minimal effort.' },
      { id: 'q4-c', shortAnswer: 'Comfort & Support', longAnswer: 'I prioritize comfort and good support.' },
      { id: 'q4-d', shortAnswer: 'Trusted & Popular', longAnswer: 'I want something trusted and popular.' },
    ],
  };
}

function generateQ5(answers: SelectedAnswer[]): AIQuestion {
  const profile = buildProfile(answers);
  const isGrill = profile.grillScore > profile.skechersScore;
  
  if (isGrill) {
    // Grill: Setup/style question (maps to products)
    return {
      id: 'q5',
      question: `Great! For outdoor cooking, what setup style fits you best?`,
      basedOn: [profile.location, profile.priority].filter(Boolean),
      options: [
        { id: 'q5-a', shortAnswer: 'Electric + Propane combo', longAnswer: 'I want a versatile electric and propane combo.' },
        { id: 'q5-b', shortAnswer: 'Premium high-end', longAnswer: 'I want a premium, high-end grill.' },
        { id: 'q5-c', shortAnswer: 'Mid-range value', longAnswer: 'I prefer a solid mid-range option.' },
        { id: 'q5-d', shortAnswer: 'Searing power + Griddle', longAnswer: 'I want maximum searing power with griddle versatility.' },
      ],
    };
  } else {
    // Skechers: Comfort feature question (maps to products)
    return {
      id: 'q5',
      question: `Perfect! For all-day comfort, which feature matters most?`,
      basedOn: [profile.location, profile.priority].filter(Boolean),
      options: [
        { id: 'q5-a', shortAnswer: 'Easy slip-on', longAnswer: 'I want easy slip-on convenience.' },
        { id: 'q5-b', shortAnswer: 'Arch support', longAnswer: 'I need good arch support.' },
        { id: 'q5-c', shortAnswer: 'Lightweight & breathable', longAnswer: 'I want lightweight and breathable shoes.' },
        { id: 'q5-d', shortAnswer: 'Balanced all-around', longAnswer: 'I want balanced all-around comfort.' },
      ],
    };
  }
}

function generateQ6(answers: SelectedAnswer[]): AIQuestion {
  const profile = buildProfile(answers);
  const audience = profile.audience || 'you';
  const audienceLabel = audience === 'Me' ? 'yourself' : 
                        audience === 'Friend' ? 'a friend' : 
                        audience === 'Family' ? 'your family' : 'yourself';
  
  return {
    id: 'q6',
    question: `Last step — given ${audienceLabel}, "${profile.goal.toLowerCase()}", and "${profile.location.toLowerCase()}", how should I prioritize the recommendation?`,
    basedOn: [audience, profile.goal, profile.location].filter(Boolean),
    options: [
      { id: 'q6-a', shortAnswer: 'Best value', longAnswer: 'Prioritize best value for the money.' },
      { id: 'q6-b', shortAnswer: 'Premium choice', longAnswer: 'Prioritize the premium, top-tier option.' },
      { id: 'q6-c', shortAnswer: 'Most convenient', longAnswer: 'Prioritize the most convenient option.' },
      { id: 'q6-d', shortAnswer: 'Surprise me', longAnswer: 'Surprise me with your best pick!' },
    ],
  };
}

// =========================================
// Main Question Flow Controller
// =========================================
export function getNextQuestion(answers: SelectedAnswer[]): AIQuestion | null {
  const count = answers.length;
  
  switch (count) {
    case 0: return Q1_AUDIENCE;
    case 1: return generateQ2(answers);
    case 2: return generateQ3(answers);
    case 3: return generateQ4(answers);
    case 4: return generateQ5(answers);
    case 5: return generateQ6(answers);
    default: return null;
  }
}

// =========================================
// Interpretation Generation
// =========================================
export function generateInterpretation(answers: SelectedAnswer[]): AIInterpretation {
  const profile = buildProfile(answers);
  const q5Answer = answers.find(a => a.questionId === 'q5')?.shortAnswer || '';
  const q6Answer = answers.find(a => a.questionId === 'q6')?.shortAnswer || '';
  
  // Determine inferred category
  const isGrill = profile.grillScore > profile.skechersScore;
  const category: 'Grill' | 'Skechers' = isGrill ? 'Grill' : 'Skechers';
  
  // Build category reasoning
  const signals: string[] = [];
  if (profile.goal.toLowerCase().includes('cooking') || profile.goal.toLowerCase().includes('hosting')) {
    signals.push('cooking/hosting goal');
  }
  if (profile.goal.toLowerCase().includes('walking') || profile.goal.toLowerCase().includes('comfort')) {
    signals.push('comfort/walking goal');
  }
  if (profile.location.toLowerCase().includes('backyard') || profile.location.toLowerCase().includes('outdoor')) {
    signals.push('outdoor location');
  }
  if (profile.location.toLowerCase().includes('travel') || profile.location.toLowerCase().includes('work')) {
    signals.push('travel/work location');
  }
  if (profile.priority.toLowerCase().includes('power')) {
    signals.push('power priority');
  }
  if (profile.priority.toLowerCase().includes('comfort')) {
    signals.push('comfort priority');
  }
  
  const categoryReasoning = signals.length > 0 
    ? `Inferred from: ${signals.join(', ')}`
    : `Based on overall profile (Grill: ${profile.grillScore}, Shoes: ${profile.skechersScore})`;
  
  // Brand sensitivity
  let brandSensitive = false;
  let brandSensitivityLabel = 'Open to recommendations';
  if (profile.priority.toLowerCase().includes('trusted') || profile.priority.toLowerCase().includes('popular')) {
    brandSensitive = true;
    brandSensitivityLabel = 'Prefers trusted brands';
  } else if (q6Answer.toLowerCase().includes('premium')) {
    brandSensitive = true;
    brandSensitivityLabel = 'Quality-focused';
  } else if (q6Answer.toLowerCase().includes('value')) {
    brandSensitivityLabel = 'Value-conscious';
  }
  
  // Price range from Q6
  let priceRange = 'Mid-range';
  if (q6Answer.toLowerCase().includes('value')) {
    priceRange = 'Budget-friendly';
  } else if (q6Answer.toLowerCase().includes('premium')) {
    priceRange = 'Premium';
  }
  
  // Brands
  const brands = category === 'Grill' 
    ? ['Weber', 'Ninja', 'Char-Broil'] 
    : ['Skechers'];
  
  // Audience label for notes
  const audienceLabel = profile.audience === 'Me' ? 'personal use' : 
                        profile.audience === 'Friend' ? 'a friend' : 
                        profile.audience === 'Family' ? 'family' : 'browsing';
  
  const notes = `Shopping for ${audienceLabel}. Goal: ${profile.goal.toLowerCase()}. Location: ${profile.location.toLowerCase()}. Priority: ${profile.priority.toLowerCase()}.`;
  
  return {
    audience: profile.audience || 'Self',
    goal: profile.goal || 'Exploring',
    location: profile.location || 'Home',
    priority: profile.priority || 'Balanced',
    category,
    categoryReasoning,
    setupStyle: category === 'Grill' ? q5Answer : undefined,
    comfortFeature: category === 'Skechers' ? q5Answer : undefined,
    finalPriority: q6Answer || 'Balanced',
    brandSensitive,
    brandSensitivityLabel,
    brands,
    priceRange,
    notes,
  };
}

// =========================================
// Product Recommendation (Deterministic Mapping)
// =========================================
export function getRecommendedProducts(interpretation: AIInterpretation): string[] {
  const { category, setupStyle, comfortFeature, finalPriority } = interpretation;
  const recommendations: string[] = [];
  
  if (category === 'Grill') {
    // Grill mapping based on Q5 answer
    const style = (setupStyle || '').toLowerCase();
    
    if (style.includes('electric') || style.includes('combo')) {
      recommendations.push('grill-ninja-flexflame');
    } else if (style.includes('premium') || style.includes('high-end')) {
      recommendations.push('grill-weber-genesis');
    } else if (style.includes('mid-range') || style.includes('value')) {
      recommendations.push('grill-weber-spirit');
    } else if (style.includes('searing') || style.includes('griddle')) {
      recommendations.push('grill-charbroil-amplifire');
    }
    
    // Fallback based on final priority
    if (recommendations.length === 0) {
      if (finalPriority.toLowerCase().includes('value')) {
        recommendations.push('grill-ninja-flexflame');
      } else if (finalPriority.toLowerCase().includes('premium')) {
        recommendations.push('grill-weber-genesis');
      } else {
        recommendations.push('grill-weber-spirit');
      }
    }
  } else {
    // Skechers mapping based on Q5 answer
    const feature = (comfortFeature || '').toLowerCase();
    
    if (feature.includes('slip-on')) {
      recommendations.push('skechers-slip-ins');
    } else if (feature.includes('arch')) {
      recommendations.push('skechers-arch-fit');
    } else if (feature.includes('lightweight') || feature.includes('breathable')) {
      recommendations.push('skechers-gowalk');
    } else if (feature.includes('balanced')) {
      // Default to Go Walk for balanced
      recommendations.push('skechers-gowalk');
    }
    
    // Fallback based on final priority
    if (recommendations.length === 0) {
      if (finalPriority.toLowerCase().includes('convenient')) {
        recommendations.push('skechers-slip-ins');
      } else if (finalPriority.toLowerCase().includes('premium')) {
        recommendations.push('skechers-arch-fit');
      } else {
        recommendations.push('skechers-gowalk');
      }
    }
  }
  
  return [...new Set(recommendations)].slice(0, 3);
}

// =========================================
// Product Badges
// =========================================
export function getProductBadges(productId: string, interpretation: AIInterpretation): string[] {
  const { finalPriority, category, setupStyle, comfortFeature } = interpretation;
  const product = products.find(p => p.id === productId);
  if (!product) return [];
  
  const badges: string[] = [];
  
  // Final priority badges
  if (finalPriority.toLowerCase().includes('value') && product.price < 500) {
    badges.push('Great value');
  }
  if (finalPriority.toLowerCase().includes('premium') && product.tags.includes('premium')) {
    badges.push('Premium pick');
  }
  if (finalPriority.toLowerCase().includes('convenient') && (product.tags.includes('convenient') || product.tags.includes('easy'))) {
    badges.push('Easy to use');
  }
  
  // Category-specific badges
  if (category === 'Grill') {
    if (setupStyle?.toLowerCase().includes('combo') && product.tags.includes('combo')) {
      badges.push('2-in-1 combo');
    }
    if (product.tags.includes('versatile')) {
      badges.push('Versatile');
    }
  } else {
    if (comfortFeature?.toLowerCase().includes('slip-on') && product.tags.includes('slip-on')) {
      badges.push('Easy slip-on');
    }
    if (comfortFeature?.toLowerCase().includes('arch') && product.tags.includes('arch-support')) {
      badges.push('Arch support');
    }
    if (product.tags.includes('lightweight')) {
      badges.push('Lightweight');
    }
  }
  
  return [...new Set(badges)].slice(0, 2);
}

// =========================================
// Simple Search (for Simple tab)
// =========================================
export function simpleSearchProducts(productName: string, categoryFilter: string): string[] {
  const searchTerm = productName.toLowerCase().trim();
  const category = categoryFilter.toLowerCase();
  
  let filtered = [...products];
  
  if (searchTerm) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      p.brand.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm) ||
      p.tags.some(t => t.toLowerCase().includes(searchTerm))
    );
  }
  
  if (category && category !== 'all') {
    if (category === 'grill' || category === 'grills') {
      filtered = filtered.filter(p => p.category === 'Grill');
    } else if (category === 'skechers' || category === 'shoes') {
      filtered = filtered.filter(p => p.category === 'Skechers');
    }
  }
  
  if (filtered.length === 0) {
    filtered = [...products];
  }
  
  return filtered.map(p => p.id);
}

export function generateSimpleInterpretation(productName: string, category: string): AIInterpretation {
  const categoryLabel: 'Grill' | 'Skechers' = category.toLowerCase().includes('grill') ? 'Grill' : 'Skechers';
  
  return {
    audience: 'Self',
    goal: 'Exploring',
    location: 'Home',
    priority: 'Best quality',
    category: categoryLabel,
    categoryReasoning: 'Direct search',
    finalPriority: 'Balanced',
    brandSensitive: false,
    brandSensitivityLabel: 'Open to recommendations',
    brands: categoryLabel === 'Grill' ? ['Weber', 'Ninja', 'Char-Broil'] : ['Skechers'],
    priceRange: 'All ranges',
    notes: productName 
      ? `Searching for "${productName}" in ${categoryLabel} products.`
      : `Browsing ${categoryLabel} products.`,
  };
}
