import { useState, useCallback } from 'react';
import {
  recognizePersona as recognizePersonaAPI,
  savePersona as savePersonaAPI,
  type Persona,
  type PersonaRecognitionResult
} from '@/services/personaService';

/**
 * Persona types that can only have ONE instance per user
 * (e.g., you can only have one mother, one wife, etc.)
 */
const UNIQUE_PERSONA_TYPES = [
  'mother', 'father', 'wife', 'husband', 'partner',
  'brother', 'sister', 'son', 'daughter',
  'grandmother', 'grandfather', 'aunt', 'uncle',
  'girlfriend', 'boyfriend', 'boss', 'cousin'
];

/**
 * Persona types that can have MULTIPLE instances
 * (e.g., you can have many friends, coworkers, etc.)
 */
const MULTI_PERSONA_TYPES = ['friend', 'coworker', 'neighbor'];

/**
 * Check if a persona type is unique (only one allowed)
 */
export function isUniquePersonaType(type: string): boolean {
  return UNIQUE_PERSONA_TYPES.includes(type.toLowerCase());
}

/**
 * Check if a persona type allows multiple instances
 */
export function isMultiPersonaType(type: string): boolean {
  return MULTI_PERSONA_TYPES.includes(type.toLowerCase());
}

export interface PersonaLoadResult {
  found: boolean;
  persona: Persona | null;
  needsInfo: string[];
  message: string;
}

export interface UsePersonaReturn {
  // State
  currentPersona: Persona | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadPersona: (type: string, name?: string) => Promise<PersonaLoadResult>;
  savePersona: (personaData: Omit<Persona, '_id' | 'createdAt' | 'updatedAt'>) => Promise<Persona | null>;
  updatePersona: (updates: Partial<Persona>) => Promise<Persona | null>;
  clearPersona: () => void;
  
  // Utilities
  isUniqueType: (type: string) => boolean;
  isMultiType: (type: string) => boolean;
}

/**
 * Centralized hook for all persona operations
 * Used by Voice Assistant, Browse & Select, and Chat Interface
 */
export function usePersona(): UsePersonaReturn {
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Smart persona loading with immediate database lookup
   * Uses centralized recognition service
   */
  const loadPersona = useCallback(async (type: string, name?: string): Promise<PersonaLoadResult> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔍 Loading persona: type="${type}", name="${name || 'none'}"`);

      // Use centralized recognition service
      const result = await recognizePersonaAPI(type, name);

      if (!result) {
        throw new Error('Persona recognition failed');
      }

      // If persona was found, set it as current
      if (result.found && result.persona) {
        console.log(`✅ Persona found:`, result.persona.name);
        setCurrentPersona(result.persona);
      } else {
        console.log(`❌ Persona not found - needs info:`, result.needsInfo);
      }

      setIsLoading(false);
      return {
        found: result.found,
        persona: result.persona,
        needsInfo: result.needsInfo,
        message: result.message
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load persona';
      console.error('Error loading persona:', err);
      setError(errorMessage);
      setIsLoading(false);
      return {
        found: false,
        persona: null,
        needsInfo: ['name', 'age', 'gender', 'interests'],
        message: 'Failed to load persona information'
      };
    }
  }, []);

  /**
   * Save a new persona or update existing one
   */
  const savePersona = useCallback(async (
    personaData: Omit<Persona, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<Persona | null> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('💾 Saving persona:', personaData);
      const saved = await savePersonaAPI(personaData);

      if (saved) {
        console.log('✅ Persona saved successfully:', saved);
        setCurrentPersona(saved);
        setIsLoading(false);
        return saved;
      } else {
        throw new Error('Failed to save persona');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save persona';
      console.error('Error saving persona:', err);
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, []);

  /**
   * Update current persona with partial data
   */
  const updatePersona = useCallback(async (
    updates: Partial<Persona>
  ): Promise<Persona | null> => {
    if (!currentPersona) {
      setError('No persona to update');
      return null;
    }

    const updatedData = {
      type: currentPersona.type,
      name: updates.name ?? currentPersona.name,
      age: updates.age ?? currentPersona.age,
      gender: updates.gender ?? currentPersona.gender,
      interests: updates.interests ?? currentPersona.interests,
    };

    return savePersona(updatedData);
  }, [currentPersona, savePersona]);

  /**
   * Clear current persona
   */
  const clearPersona = useCallback(() => {
    setCurrentPersona(null);
    setError(null);
  }, []);

  return {
    // State
    currentPersona,
    isLoading,
    error,

    // Actions
    loadPersona,
    savePersona,
    updatePersona,
    clearPersona,

    // Utilities
    isUniqueType: isUniquePersonaType,
    isMultiType: isMultiPersonaType,
  };
}

