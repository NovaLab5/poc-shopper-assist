import Persona from '../models/Persona.js';

/**
 * Persona types that can only have ONE instance per user
 */
const UNIQUE_PERSONA_TYPES = [
  'mother', 'father', 'wife', 'husband', 'partner',
  'brother', 'sister', 'son', 'daughter',
  'grandmother', 'grandfather', 'aunt', 'uncle',
  'girlfriend', 'boyfriend', 'boss', 'cousin'
];

/**
 * Persona types that can have MULTIPLE instances
 */
const MULTI_PERSONA_TYPES = ['friend', 'coworker', 'neighbor'];

export interface PersonaRecognitionResult {
  found: boolean;
  persona: any | null;
  needsInfo: string[]; // List of missing fields: 'name', 'age', 'interests', etc.
  message: string; // User-friendly message
}

/**
 * Smart persona recognition - checks database FIRST before asking questions
 * This is the centralized logic used by all flows
 */
export async function recognizePersona(
  type: string,
  name?: string
): Promise<PersonaRecognitionResult> {
  const normalizedType = type.toLowerCase();

  // For unique persona types (wife, mother, etc.), check database immediately
  if (UNIQUE_PERSONA_TYPES.includes(normalizedType)) {
    console.log(`🔍 Checking database for unique persona: ${normalizedType}`);
    
    const persona = await Persona.findOne({ type: normalizedType });
    
    if (persona) {
      console.log(`✅ Found existing ${normalizedType}:`, persona.name);
      return {
        found: true,
        persona,
        needsInfo: [],
        message: `Great! Shopping for ${persona.name}. I remember ${persona.name} is ${persona.age} years old and interested in ${persona.interests.slice(0, 2).join(', ')}.`
      };
    } else {
      console.log(`❌ No ${normalizedType} found - needs creation`);
      return {
        found: false,
        persona: null,
        needsInfo: ['name', 'age', 'gender', 'interests'],
        message: `I don't have information about your ${normalizedType} yet. Let's add them!`
      };
    }
  }

  // For multi-instance types (friends), search by name if provided
  if (MULTI_PERSONA_TYPES.includes(normalizedType)) {
    if (name) {
      console.log(`🔍 Searching for ${normalizedType} named: ${name}`);
      
      const allPersonas = await Persona.find({ type: normalizedType });
      const match = allPersonas.find(p => 
        p.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(p.name.toLowerCase())
      );

      if (match) {
        console.log(`✅ Found matching ${normalizedType}:`, match.name);
        return {
          found: true,
          persona: match,
          needsInfo: [],
          message: `Perfect! I found ${match.name}. ${match.name} is ${match.age} years old and interested in ${match.interests.slice(0, 2).join(', ')}.`
        };
      }
    }

    // Check if there are any personas of this type
    const count = await Persona.countDocuments({ type: normalizedType });
    
    if (count > 0 && !name) {
      return {
        found: false,
        persona: null,
        needsInfo: ['name'],
        message: `You have ${count} ${normalizedType}${count > 1 ? 's' : ''} saved. What's their name?`
      };
    } else {
      return {
        found: false,
        persona: null,
        needsInfo: ['name', 'age', 'gender', 'interests'],
        message: name 
          ? `I couldn't find ${name} in your ${normalizedType}s. Let's add them!`
          : `Let's add a new ${normalizedType}! What's their name?`
      };
    }
  }

  // Unknown type - needs all info
  return {
    found: false,
    persona: null,
    needsInfo: ['name', 'age', 'gender', 'interests'],
    message: `Let's add information about this person.`
  };
}

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

/**
 * Get all missing fields for a persona
 */
export function getMissingPersonaFields(persona: any): string[] {
  const missing: string[] = [];
  
  if (!persona.name || persona.name.startsWith('My ')) missing.push('name');
  if (!persona.age || persona.age === 30) missing.push('age');
  if (!persona.gender || persona.gender === 'other') missing.push('gender');
  if (!persona.interests || persona.interests.length === 0) missing.push('interests');
  
  return missing;
}

