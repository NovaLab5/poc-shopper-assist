import express, { Request, Response } from 'express';
import { recognizePersona } from '../services/personaRecognition.js';

const router = express.Router();

/**
 * POST /api/v1/persona-recognition
 * Smart persona recognition - checks database FIRST before asking questions
 * 
 * Body: { type: string, name?: string }
 * Returns: { found: boolean, persona: Persona | null, needsInfo: string[], message: string }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, name } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: type',
      });
    }

    console.log(`🔍 Persona recognition request: type="${type}", name="${name || 'none'}"`);

    const result = await recognizePersona(type, name);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in persona recognition:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to recognize persona',
    });
  }
});

export default router;

