const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Persona {
  _id?: string;
  type: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
  lastPurchase?: {
    item: string;
    occasion: string;
    date: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PersonaResponse {
  success: boolean;
  data?: Persona;
  message?: string;
  error?: string;
}

export interface PersonasResponse {
  success: boolean;
  data?: Persona[];
  error?: string;
}

/**
 * Get a persona by type (e.g., mother, father, friend)
 */
export async function getPersonaByType(type: string): Promise<Persona | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/personas/${type}`);
    const result: PersonaResponse = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching persona:', error);
    return null;
  }
}

/**
 * Create or update a persona
 */
export async function savePersona(persona: Omit<Persona, '_id' | 'createdAt' | 'updatedAt'>): Promise<Persona | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/personas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(persona),
    });
    
    const result: PersonaResponse = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error saving persona:', error);
    return null;
  }
}

/**
 * Update last purchase for a persona
 */
export async function updatePersonaPurchase(
  type: string,
  item: string,
  occasion: string
): Promise<Persona | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/personas/${type}/purchase`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ item, occasion }),
    });
    
    const result: PersonaResponse = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error updating purchase:', error);
    return null;
  }
}

/**
 * Get all personas
 */
export async function getAllPersonas(): Promise<Persona[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/personas`);
    const result: PersonasResponse = await response.json();

    if (result.success && result.data) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching personas:', error);
    return [];
  }
}

/**
 * Get all personas of a specific type (e.g., all friends)
 */
export async function getPersonasByType(type: string): Promise<Persona[]> {
  try {
    const allPersonas = await getAllPersonas();
    const filtered = allPersonas.filter(p => p.type.toLowerCase() === type.toLowerCase());
    console.log(`getPersonasByType(${type}): Found ${filtered.length} personas`, filtered);
    return filtered;
  } catch (error) {
    console.error('Error fetching personas by type:', error);
    return [];
  }
}

