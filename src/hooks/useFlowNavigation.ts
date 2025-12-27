import { useState, useCallback, useMemo } from 'react';
import flowData from '@/data/userFlow.json';
import { 
  FlowState, 
  FlowStep, 
  FlowEntryNode, 
  FlowCategory, 
  FlowSubcategory,
  FlowResults,
  FlowQuestion,
  FlowPreference,
  FlowSession
} from '@/lib/flowTypes';

const STORAGE_KEY = 'flow_sessions';

// Map of gendered recipients to automatically set gender
const GENDERED_RECIPIENTS: Record<string, string> = {
  mother: 'female',
  father: 'male',
  wife: 'female',
  husband: 'male',
  brother: 'male',
  sister: 'female',
  grandmother: 'female',
  grandfather: 'male',
  aunt: 'female',
  uncle: 'male',
  son: 'male',
  daughter: 'female',
  girlfriend: 'female',
  boyfriend: 'male',
  nephew: 'male',
  niece: 'female',
  cousin: 'neutral',
};

const initialState: FlowState = {
  currentStep: 'entry',
  entryPoint: null,
  recipient: null,
  category: null,
  subcategory: null,
  preference: null,
  questionAnswers: {},
  stepHistory: ['entry'],
  totalSteps: 1,
  currentStepNumber: 1,
  currentQuestionIndex: 0,
};

export function useFlowNavigation() {
  const [state, setState] = useState<FlowState>(initialState);
  const data = flowData as unknown as Record<string, unknown>;

  // Get the current entry node based on selected entry point
  const currentEntryNode = useMemo((): FlowEntryNode | null => {
    if (!state.entryPoint) return null;
    return data[state.entryPoint] as FlowEntryNode;
  }, [state.entryPoint, data]);

  // Get current category node
  const currentCategoryNode = useMemo((): FlowCategory | null => {
    if (!currentEntryNode?.categories || !state.category) return null;
    return currentEntryNode.categories[state.category];
  }, [currentEntryNode, state.category]);

  // Get current subcategory node
  const currentSubcategoryNode = useMemo((): FlowSubcategory | null => {
    if (!currentCategoryNode || !state.subcategory) return null;
    const subs = currentCategoryNode.subcategories;
    if (!subs || Array.isArray(subs)) return null;
    return subs[state.subcategory] || null;
  }, [currentCategoryNode, state.subcategory]);

  // Calculate total steps based on path
  const calculateTotalSteps = useCallback((entryPoint: string): number => {
    const node = data[entryPoint] as FlowEntryNode;
    let steps = 1; // entry

    // For browsing flow, add 2 initial loading screens
    if (entryPoint === 'browsing') {
      steps += 2; // loading_browsing_welcome + loading_browsing_data
    }

    if (node?.questions?.length) {
      steps += node.questions.length; // each question is a step

      // For "others" flow, add loading screens between questions (3 loading screens)
      if (entryPoint === 'others') {
        steps += 3; // loading_recipient_info, loading_ai_thinking, loading_interests_check
      }
    }

    if (node?.categories) {
      steps += 4; // loading_categories + categories + loading_subcategories + subcategories
    }

    steps += 2; // loading_results + results
    return steps;
  }, [data]);

  // Get entry points
  const entryPoints = useMemo(() => (data.entryPoints as string[]) || [], [data]);

  // Get questions for current entry point (filtered based on recipient)
  const questions = useMemo((): FlowQuestion[] => {
    const allQuestions = currentEntryNode?.questions || [];
    const recipient = state.questionAnswers['forWhom'] as string;
    
    // If recipient is gendered, skip the gender question
    if (recipient && GENDERED_RECIPIENTS[recipient] && GENDERED_RECIPIENTS[recipient] !== 'neutral') {
      return allQuestions.filter(q => q.key !== 'gender');
    }
    
    return allQuestions;
  }, [currentEntryNode, state.questionAnswers]);

  // Get current question
  const currentQuestion = useMemo((): FlowQuestion | null => {
    if (questions.length === 0) return null;
    if (state.currentQuestionIndex >= questions.length) return null;
    return questions[state.currentQuestionIndex];
  }, [questions, state.currentQuestionIndex]);

  // Get recipients for current entry point
  const recipients = useMemo((): string[] => {
    if (!currentEntryNode?.recipients) return [];
    return Object.keys(currentEntryNode.recipients).filter(k => k !== 'load_more');
  }, [currentEntryNode]);

  // Get load more recipients
  const loadMoreRecipients = useMemo((): string[] => {
    return (currentEntryNode as FlowEntryNode & { loadMoreRecipients?: string[] })?.loadMoreRecipients || [];
  }, [currentEntryNode]);

  // Get categories with labels for current entry point (limit to 4, exclude load_more)
  const categories = useMemo((): { key: string; label: string }[] => {
    if (!currentEntryNode?.categories) return [];
    return Object.entries(currentEntryNode.categories)
      .filter(([key]) => key !== 'load_more')
      .slice(0, 4)
      .map(([key, cat]) => ({
        key,
        label: cat.label || key,
      }));
  }, [currentEntryNode]);

  // Get load more categories
  const loadMoreCategories = useMemo((): string[] => {
    if (!currentEntryNode?.categories) return [];
    const allCats = Object.keys(currentEntryNode.categories).filter(k => k !== 'load_more');
    return allCats.slice(4);
  }, [currentEntryNode]);

  // Get all browsing categories for search
  const allBrowsingCategories = useMemo((): string[] => {
    return (data.browsing as FlowEntryNode & { allCategories?: string[] })?.allCategories || [];
  }, [data]);

  // Get subcategories with labels for current category
  const subcategories = useMemo((): { key: string; label: string }[] => {
    if (!currentCategoryNode) return [];
    const subs = currentCategoryNode.subcategories;
    if (!subs) return [];

    // If array of strings (browsing flow)
    if (Array.isArray(subs)) {
      return subs.filter(s => s !== 'load_more').map(s => ({ key: s, label: s }));
    }

    // If object with labels
    return Object.entries(subs)
      .filter(([key]) => key !== 'load_more')
      .map(([key, sub]) => ({
        key,
        label: sub.label || key,
      }));
  }, [currentCategoryNode]);

  // Get all subcategories for search (all subcategories in current category)
  const allSubcategories = useMemo((): string[] => {
    if (!currentCategoryNode) return [];
    const subs = currentCategoryNode.subcategories;
    if (!subs) return [];

    // If array of strings (browsing flow)
    if (Array.isArray(subs)) {
      return subs.filter(s => s !== 'load_more');
    }

    // If object with labels
    return Object.entries(subs)
      .filter(([key]) => key !== 'load_more')
      .map(([key, sub]) => sub.label || key);
  }, [currentCategoryNode]);

  // Get preferences for current subcategory
  const preferences = useMemo((): FlowPreference | null => {
    return currentSubcategoryNode?.preferences || null;
  }, [currentSubcategoryNode]);

  // Get results for current subcategory
  const results = useMemo((): FlowResults | null => {
    return currentSubcategoryNode?.results || null;
  }, [currentSubcategoryNode]);

  // Determine next step after current
  const getNextStep = useCallback((current: FlowStep, entryNode: FlowEntryNode | null, entryPoint?: string | null): FlowStep => {
    switch (current) {
      case 'entry':
        // For browsing flow, go to first loading screen
        if (entryPoint === 'browsing') return 'loading_browsing_welcome';
        if (entryNode?.questions?.length) return 'questions';
        if (entryNode?.categories) return 'loading_categories';
        return 'results';
      case 'loading_browsing_welcome':
        return 'loading_browsing_data';
      case 'loading_browsing_data':
        return 'questions';
      case 'questions':
        if (entryNode?.categories) return 'loading_categories';
        return 'results';
      case 'loading_categories':
        return 'categories';
      case 'categories':
        return 'loading_subcategories';
      case 'loading_subcategories':
        return 'subcategories';
      case 'subcategories':
        return 'loading_results';
      case 'loading_results':
        return 'results';
      case 'preferences':
        return 'results';
      default:
        return 'results';
    }
  }, []);

  // Select entry point
  const selectEntryPoint = useCallback((entry: string) => {
    const node = data[entry] as FlowEntryNode;
    const nextStep = getNextStep('entry', node, entry);
    const total = calculateTotalSteps(entry);

    setState(prev => ({
      ...prev,
      entryPoint: entry,
      currentStep: nextStep,
      stepHistory: [...prev.stepHistory, nextStep],
      totalSteps: total,
      currentStepNumber: 2,
      currentQuestionIndex: 0,
    }));
  }, [data, getNextStep, calculateTotalSteps]);

  // Answer a single question
  const answerQuestion = useCallback((answer: string | number) => {
    if (!currentQuestion) return;

    let newAnswers = { ...state.questionAnswers, [currentQuestion.key]: answer };

    // If this is a forWhom question and the answer is a gendered recipient,
    // automatically set the gender
    if (currentQuestion.key === 'forWhom' && typeof answer === 'string') {
      const gender = GENDERED_RECIPIENTS[answer];
      if (gender && gender !== 'neutral') {
        newAnswers = { ...newAnswers, gender };
      }
    }

    // Recalculate questions based on new answers
    const allQuestions = currentEntryNode?.questions || [];
    const recipient = newAnswers['forWhom'] as string;
    let filteredQuestions = allQuestions;

    if (recipient && GENDERED_RECIPIENTS[recipient] && GENDERED_RECIPIENTS[recipient] !== 'neutral') {
      filteredQuestions = allQuestions.filter(q => q.key !== 'gender');
    }

    // Find the current position in filtered questions
    const currentFilteredIndex = filteredQuestions.findIndex(q => q.key === currentQuestion.key);
    const nextQuestionIndex = currentFilteredIndex + 1;

    // For "others" flow (except friend), insert loading screens between questions
    const isOthersFlow = state.entryPoint === 'others' && recipient !== 'friend';

    // Determine if we need a loading screen after this question
    let loadingStep: FlowStep | null = null;
    if (isOthersFlow) {
      if (currentQuestion.key === 'forWhom') {
        loadingStep = 'loading_recipient_info';
      } else if (currentQuestion.key === 'age') {
        loadingStep = 'loading_ai_thinking';
      } else if (currentQuestion.key === 'occasion') {
        loadingStep = 'loading_interests_check';
      }
    }

    // Check if there are more questions
    if (nextQuestionIndex < filteredQuestions.length) {
      // If we need a loading screen, go there first
      if (loadingStep) {
        setState(prev => ({
          ...prev,
          questionAnswers: newAnswers,
          currentStep: loadingStep as FlowStep,
          stepHistory: [...prev.stepHistory, loadingStep as FlowStep],
          currentStepNumber: prev.currentStepNumber + 1,
          currentQuestionIndex: nextQuestionIndex,
        }));
      } else {
        setState(prev => ({
          ...prev,
          questionAnswers: newAnswers,
          currentQuestionIndex: nextQuestionIndex,
          currentStepNumber: prev.currentStepNumber + 1,
        }));
      }
    } else {
      // All questions answered
      if (loadingStep) {
        // Go to loading screen first, then to next step
        setState(prev => ({
          ...prev,
          questionAnswers: newAnswers,
          currentStep: loadingStep as FlowStep,
          stepHistory: [...prev.stepHistory, loadingStep as FlowStep],
          currentStepNumber: prev.currentStepNumber + 1,
          currentQuestionIndex: 0,
        }));
      } else {
        // Move to next step
        const nextStep = getNextStep('questions', currentEntryNode, state.entryPoint);
        setState(prev => ({
          ...prev,
          questionAnswers: newAnswers,
          currentStep: nextStep,
          stepHistory: [...prev.stepHistory, nextStep],
          currentStepNumber: prev.currentStepNumber + 1,
          currentQuestionIndex: 0,
        }));
      }
    }
  }, [currentQuestion, state.questionAnswers, state.entryPoint, currentEntryNode, getNextStep]);

  // Select category
  const selectCategory = useCallback((category: string) => {
    setState(prev => ({
      ...prev,
      category,
      currentStep: 'loading_subcategories',
      stepHistory: [...prev.stepHistory, 'loading_subcategories'],
      currentStepNumber: prev.currentStepNumber + 1,
    }));
  }, []);

  // Select subcategory
  const selectSubcategory = useCallback((subcategory: string) => {
    // Go to loading screen first
    setState(prev => ({
      ...prev,
      subcategory,
      currentStep: 'loading_results',
      stepHistory: [...prev.stepHistory, 'loading_results'],
      currentStepNumber: prev.currentStepNumber + 1,
    }));
  }, []);

  // Select preference
  const selectPreference = useCallback((preference: string) => {
    setState(prev => ({
      ...prev,
      preference,
      currentStep: 'results',
      stepHistory: [...prev.stepHistory, 'results'],
      currentStepNumber: prev.currentStepNumber + 1,
    }));
  }, []);

  // Skip questions and go directly to categories with pre-filled data
  const skipToCategories = useCallback((answers: Record<string, string | number>) => {
    setState(prev => ({
      ...prev,
      questionAnswers: answers,
      currentStep: 'categories',
      stepHistory: [...prev.stepHistory, 'categories'],
      currentStepNumber: prev.currentStepNumber + 1,
    }));
  }, []);

  // Save session to localStorage
  const saveSession = useCallback(() => {
    if (!results) return;
    
    const session: FlowSession = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      state: { ...state },
      results,
    };

    const existing = localStorage.getItem(STORAGE_KEY);
    const sessions: FlowSession[] = existing ? JSON.parse(existing) : [];
    sessions.push(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [state, results]);

  // Get saved sessions
  const getSessions = useCallback((): FlowSession[] => {
    const existing = localStorage.getItem(STORAGE_KEY);
    return existing ? JSON.parse(existing) : [];
  }, []);

  // Complete loading and move to next step
  const completeLoading = useCallback(() => {
    // Handle new loading screens for "others" flow
    if (state.currentStep === 'loading_recipient_info') {
      // After loading recipient info, go to next question (age)
      setState(prev => ({
        ...prev,
        currentStep: 'questions',
        currentStepNumber: prev.currentStepNumber + 1,
      }));
      return;
    }

    if (state.currentStep === 'loading_ai_thinking') {
      setState(prev => ({
        ...prev,
        currentStep: 'questions',
        currentStepNumber: prev.currentStepNumber + 1,
      }));
      return;
    }

    if (state.currentStep === 'loading_interests_check') {
      setState(prev => ({
        ...prev,
        currentStep: 'loading_categories',
        stepHistory: [...prev.stepHistory, 'loading_categories'],
        currentStepNumber: prev.currentStepNumber + 1,
      }));
      return;
    }

    // For all other loading screens, just go to next step
    const nextStep = getNextStep(state.currentStep, currentEntryNode, state.entryPoint);
    setState(prev => ({
      ...prev,
      currentStep: nextStep,
      stepHistory: [...prev.stepHistory, nextStep],
      currentStepNumber: prev.currentStepNumber + 1,
    }));
  }, [state.currentStep, state.entryPoint, currentEntryNode, getNextStep]);

  // Reset flow
  const resetFlow = useCallback(() => {
    setState(initialState);
  }, []);

  // Go back one step
  const goBack = useCallback(() => {
    setState(prev => {
      // Can't go back from entry
      if (prev.currentStep === 'entry' || prev.stepHistory.length <= 1) {
        return prev;
      }

      // Get the previous step from history
      const newHistory = [...prev.stepHistory];
      newHistory.pop(); // Remove current step
      const previousStep = newHistory[newHistory.length - 1];

      // Determine what to clear based on the step we're going back from
      const updates: Partial<FlowState> = {
        currentStep: previousStep,
        stepHistory: newHistory,
        currentStepNumber: Math.max(1, prev.currentStepNumber - 1),
      };

      // Clear data when going back from certain steps
      if (prev.currentStep === 'subcategories' || prev.currentStep === 'loading_results') {
        updates.subcategory = null;
      }
      if (prev.currentStep === 'categories') {
        updates.category = null;
      }
      if (prev.currentStep === 'preferences' || prev.currentStep === 'results') {
        updates.preference = null;
      }

      return { ...prev, ...updates };
    });
  }, []);

  return {
    state,
    setState,
    entryPoints,
    questions,
    currentQuestion,
    categories,
    loadMoreCategories,
    loadMoreRecipients,
    allBrowsingCategories,
    subcategories,
    allSubcategories,
    preferences,
    results,
    selectEntryPoint,
    answerQuestion,
    skipToCategories,
    selectCategory,
    selectSubcategory,
    selectPreference,
    completeLoading,
    saveSession,
    getSessions,
    resetFlow,
    goBack,
  };
}