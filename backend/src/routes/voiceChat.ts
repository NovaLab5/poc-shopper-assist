import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Conversation } from '../models/Conversation.js';
import Persona from '../models/Persona.js';

const router = express.Router();

/**
 * Build system prompt with dynamic persona data from database
 */
async function buildSystemPrompt(userName: string): Promise<string> {
  // Fetch all personas from database
  const personas = await Persona.find().sort({ updatedAt: -1 });

  // Build personas database section
  let personasSection = '';
  if (personas.length > 0) {
    personasSection = '\n\nKNOWN PERSONAS DATABASE:\n';
    personas.forEach(persona => {
      const interests = persona.interests.join(', ');
      let personaInfo = `- ${persona.name} (${persona.type}): ${persona.age}-year-old ${persona.gender}, loves ${interests}.`;

      if (persona.lastPurchase) {
        personaInfo += ` Previously bought them ${persona.lastPurchase.item} for ${persona.lastPurchase.occasion}.`;
      }

      personasSection += personaInfo + '\n';
    });
  }

  return `You are a friendly shopping assistant for Sour Dillmas gift shopping app. Your name is Dilly.

USER PROFILE:
- Name: ${userName}

${personasSection}
CONVERSATION FLOW - FOLLOW EXACTLY:

STEP 1: User mentions buying for someone (mother, father, friend, etc.)
→ Response: "That's wonderful! Is this someone I know? What's their name?"
→ DO NOT add [SHOW_PRODUCTS]

STEP 2: User provides person's name or type (e.g., "my mother", "James")
→ If person is in KNOWN PERSONAS DATABASE: Acknowledge warmly and mention what you know about them, then ask "What's the occasion?"
→ If person is NOT in database: Ask for their relationship (mother/father/friend), age, gender, and interests
→ DO NOT add [SHOW_PRODUCTS]

STEP 3: User provides occasion
→ Response: Acknowledge occasion and ask "What is the budget you have in mind?"
→ DO NOT add [SHOW_PRODUCTS]

STEP 4: User provides budget and asks for suggestion
→ Response: Suggest product category based on their interests and past purchases from KNOWN PERSONAS DATABASE
→ Example: "Since you already bought them a grill, and they love technology and watches, how about an Apple Watch?"
→ DO NOT add [SHOW_PRODUCTS] yet

STEP 5: User confirms interest in the suggested category
→ Response: Acknowledge confirmation only
→ Example: "Great choice!"
→ DO NOT add [SHOW_PRODUCTS] yet

STEP 6: After user confirms, prepare to show products
→ Response: "Great! I think we can find a great [category] for [person name], within your budget. Let me show you some options." + [SHOW_PRODUCTS:category_name]
→ NOW add [SHOW_PRODUCTS:category_name]

PRODUCT CATEGORIES (use exact category ID in [SHOW_PRODUCTS:category_id]):
- grills: BBQ grills and outdoor cooking
- laptops: Laptops and notebooks
- headphones: Headphones and earbuds
- smartphones: Smartphones and mobile devices
- tv: Televisions and displays
- camera: Cameras and photography equipment
- watches: Watches and smartwatches
- socks: Socks and hosiery
- pajamas: Pajamas and sleepwear
- board-games: Board games and tabletop games
- running-gear: Running and athletic gear
- travel-gear-and-accessories: Travel gear and accessories
- home-office-furniture-and-supplies: Home office furniture and supplies
- luxurious-gifts: Luxury gifts and premium items
- anniversary-gifts: Anniversary gifts
- retirement-gifts: Retirement gifts
- self-care-gifts-for-yourself: Self-care and wellness gifts
- 25-kids-birthday-party-favors: Kids party favors and gifts
- college-dorm-essentials: College dorm essentials
- tinned-fish: Tinned fish and gourmet seafood

Start each conversation by greeting the user warmly.`;
}

/**
 * Extract and save persona information from conversation
 * This helps capture personas mentioned during voice chat
 */
async function extractAndSavePersona(conversationText: string): Promise<void> {
  // Simple pattern matching for persona information
  // In production, you might use NLP or more sophisticated extraction

  // Example patterns:
  // "My mother is 65 years old"
  // "She loves gardening and cooking"
  // "He's into gaming and tech"

  // This is a placeholder - you can enhance this with better NLP
  // For now, personas will be saved through the Browse & Select interface
}

/**
 * POST /api/v1/voice-chat
 * Handle voice chat conversation using Google Gemini
 */
router.post('/', async (req, res) => {
  try {
    const { messages, isFirstMessage, userName, userId } = req.body;

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GOOGLE_GEMINI_API_KEY not configured' });
    }

    // Initialize Google Gemini
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Build dynamic system prompt with personas from database
    const dynamicSystemPrompt = await buildSystemPrompt(userName || 'there');

    // Build chat messages
    const chatMessages = [
      { role: 'user', parts: [{ text: dynamicSystemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will follow these rules exactly.' }] },
    ];

    // If first message, add greeting prompt
    if (isFirstMessage) {
      chatMessages.push({
        role: 'user',
        parts: [{
          text: `Start the conversation by greeting me by name (${userName || 'there'}) warmly. Say exactly: "Hi ${userName || 'there'}! How can I help you find something today?"`
        }]
      });
    } else {
      // Add conversation history
      messages.forEach((msg: any) => {
        chatMessages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Call Google Gemini API
    const chat = model.startChat({
      history: chatMessages.slice(0, -1),
    });

    const result = await chat.sendMessage(chatMessages[chatMessages.length - 1].parts[0].text);
    const aiResponse = result.response.text();

    // Check for product trigger
    let showProducts = null;
    let cleanResponse = aiResponse;

    const productMatch = aiResponse.match(/\[SHOW_PRODUCTS:(\w+)\]/);
    if (productMatch) {
      const category = productMatch[1];
      // Extract budget from conversation if mentioned
      let budget = 10000; // Default high budget
      const budgetMatch = aiResponse.match(/\$?(\d+)/);
      if (budgetMatch) {
        budget = parseInt(budgetMatch[1]);
      }

      showProducts = {
        category: category,
        budget: budget
      };
      cleanResponse = aiResponse.replace(/\[SHOW_PRODUCTS:\w+\]/, '').trim();
    }

    // Save conversation to MongoDB (if userId provided)
    if (userId) {
      let conversation = await Conversation.findOne({ userId, isActive: true });
      
      if (!conversation) {
        conversation = new Conversation({
          userId,
          userName,
          messages: [],
          isActive: true,
        });
      }

      // Add messages
      if (!isFirstMessage && messages && messages.length > 0) {
        const lastUserMessage = messages[messages.length - 1];
        conversation.messages.push({
          role: lastUserMessage.role,
          content: lastUserMessage.content,
          timestamp: new Date(),
        });
      }

      conversation.messages.push({
        role: 'assistant',
        content: cleanResponse,
        timestamp: new Date(),
        showProducts: !!showProducts,
        productCategory: showProducts ? showProducts.category : undefined,
      });

      await conversation.save();
    }

    res.json({
      response: cleanResponse,
      showProducts,
    });

  } catch (error: any) {
    console.error('Voice chat error:', error.message);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

export default router;

