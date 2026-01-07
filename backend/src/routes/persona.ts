import express, { Request, Response } from 'express';
import Persona from '../models/Persona.js';

const router = express.Router();

/**
 * GET /api/v1/personas/:type
 * Get a persona by type (e.g., mother, father, friend)
 */
router.get('/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    const persona = await Persona.findOne({ type: type.toLowerCase() });
    
    if (!persona) {
      return res.status(404).json({
        success: false,
        message: `No persona found for type: ${type}`,
      });
    }

    res.json({
      success: true,
      data: persona,
    });
  } catch (error) {
    console.error('Error fetching persona:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch persona',
    });
  }
});

/**
 * POST /api/v1/personas
 * Create or update a persona
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, name, age, gender, interests } = req.body;

    // Validate required fields
    if (!type || !name || !age || !gender) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, name, age, gender',
      });
    }

    // Sanitize gender field - must be male, female, or other
    const validGenders = ['male', 'female', 'other'];
    let sanitizedGender = 'other';

    if (typeof gender === 'string') {
      const genderLower = gender.toLowerCase().trim();
      if (validGenders.includes(genderLower)) {
        sanitizedGender = genderLower;
      } else {
        console.log(`⚠️ Invalid gender value "${gender}" - using "other" as default`);
      }
    }

    const personaType = type.toLowerCase();

    // For friends, always create new (allow multiple friends)
    // For family (mother/father), update if exists
    if (personaType === 'friend') {
      // Check if this exact friend already exists
      const existingFriend = await Persona.findOne({
        type: 'friend',
        name: name
      });

      if (existingFriend) {
        // Update existing friend
        existingFriend.age = age;
        existingFriend.gender = sanitizedGender;
        existingFriend.interests = interests || [];
        await existingFriend.save();

        return res.json({
          success: true,
          data: existingFriend,
          message: 'Friend updated',
        });
      } else {
        // Create new friend
        const newFriend = new Persona({
          type: 'friend',
          name,
          age,
          gender: sanitizedGender,
          interests: interests || [],
        });
        await newFriend.save();

        return res.json({
          success: true,
          data: newFriend,
          message: 'Friend created',
        });
      }
    } else {
      // For mother/father/etc - only one per type
      let persona = await Persona.findOne({ type: personaType });

      if (persona) {
        // Update existing persona
        persona.name = name;
        persona.age = age;
        persona.gender = sanitizedGender;
        persona.interests = interests || [];
        await persona.save();
      } else {
        // Create new persona
        persona = new Persona({
          type: personaType,
          name,
          age,
          gender: sanitizedGender,
          interests: interests || [],
        });
        await persona.save();
      }

      res.json({
        success: true,
        data: persona,
        message: persona.isNew ? 'Persona created' : 'Persona updated',
      });
    }
  } catch (error) {
    console.error('Error saving persona:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save persona',
    });
  }
});

/**
 * PUT /api/v1/personas/:type/purchase
 * Update last purchase for a persona
 */
router.put('/:type/purchase', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { item, occasion } = req.body;

    if (!item || !occasion) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: item, occasion',
      });
    }

    const persona = await Persona.findOneAndUpdate(
      { type: type.toLowerCase() },
      {
        lastPurchase: {
          item,
          occasion,
          date: new Date(),
        },
      },
      { new: true }
    );

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: `No persona found for type: ${type}`,
      });
    }

    res.json({
      success: true,
      data: persona,
    });
  } catch (error) {
    console.error('Error updating purchase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update purchase',
    });
  }
});

/**
 * GET /api/v1/personas
 * Get all personas
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const personas = await Persona.find().sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      data: personas,
    });
  } catch (error) {
    console.error('Error fetching personas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch personas',
    });
  }
});

/**
 * PUT /api/v1/personas/:id
 * Update a persona by ID
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, name, age, gender, interests } = req.body;

    // Validate required fields
    if (!name || !age || !gender) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, age, gender',
      });
    }

    // Sanitize gender input
    const sanitizedGender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    if (!['Male', 'Female', 'Other'].includes(sanitizedGender)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid gender. Must be Male, Female, or Other',
      });
    }

    const updatedPersona = await Persona.findByIdAndUpdate(
      id,
      {
        type: type?.toLowerCase(),
        name,
        age,
        gender: sanitizedGender,
        interests: interests || [],
      },
      { new: true, runValidators: true }
    );

    if (!updatedPersona) {
      return res.status(404).json({
        success: false,
        message: `No persona found with ID: ${id}`,
      });
    }

    console.log(`✏️ Updated persona: ${updatedPersona.name} (${updatedPersona.type})`);

    res.json({
      success: true,
      message: `Persona ${updatedPersona.name} updated successfully`,
      data: updatedPersona,
    });
  } catch (error) {
    console.error('Error updating persona:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update persona',
    });
  }
});

/**
 * DELETE /api/v1/personas/:id
 * Delete a persona by ID
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedPersona = await Persona.findByIdAndDelete(id);

    if (!deletedPersona) {
      return res.status(404).json({
        success: false,
        message: `No persona found with ID: ${id}`,
      });
    }

    console.log(`🗑️ Deleted persona: ${deletedPersona.name} (${deletedPersona.type})`);

    res.json({
      success: true,
      message: `Persona ${deletedPersona.name} deleted successfully`,
      data: deletedPersona,
    });
  } catch (error) {
    console.error('Error deleting persona:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete persona',
    });
  }
});

export default router;

