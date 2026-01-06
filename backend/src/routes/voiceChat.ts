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

STEP 1: User mentions buying for someone
→ Check if they mentioned a specific name (e.g., "for Jessica", "for my mother")
→ If name is mentioned AND person is in KNOWN PERSONAS DATABASE:
   Response: "Great! I remember [name]! They're [age] and love [interests]. What's the occasion?"
→ If name is mentioned but NOT in database OR no name mentioned:
   Response: "That's wonderful! Is this someone I know? What's their name?"
→ DO NOT add [SHOW_PRODUCTS]

STEP 2: User provides person's name or type (e.g., "my mother", "James")
→ If person is in KNOWN PERSONAS DATABASE: Acknowledge warmly and mention what you know about them, then ask "What's the occasion?"
→ If person is NOT in database: Ask for their information in ONE question: "I'd love to help! Can you tell me about them? Their name, age, gender, and what they're interested in?"
→ DO NOT add [SHOW_PRODUCTS]

STEP 2b: User provides person's details (only if person was NOT in database)
→ User should provide: name, age, gender, interests (e.g., "Sarah, 28, female, loves yoga and cooking")
→ Response: "Got it! I'll remember Sarah for next time. What's the occasion?"
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
async function extractAndSavePersona(aiResponse: string, userMessage: string): Promise<void> {
  try {
    // Use Gemini to extract persona information from the conversation
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const extractionPrompt = `Analyze this conversation and extract persona information if present.

User said: "${userMessage}"
Assistant said: "${aiResponse}"

If the user provided information about a person (name, age, gender, interests, relationship), extract it in this EXACT JSON format:
{
  "hasPersona": true,
  "type": "friend" or "mother" or "father" or "brother" or "sister",
  "name": "person's name",
  "age": number,
  "gender": "male" or "female" or "other",
  "interests": ["interest1", "interest2"]
}

If NO persona information is present, return:
{
  "hasPersona": false
}

IMPORTANT: Only extract if the user explicitly provided this information. Do not make assumptions.
Return ONLY valid JSON, no other text.`;

    const result = await model.generateContent(extractionPrompt);
    const responseText = result.response.text().trim();

    // Remove markdown code blocks if present
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const extracted = JSON.parse(jsonText);

    if (extracted.hasPersona && extracted.name && extracted.age && extracted.gender) {
      // Check if persona already exists
      const existingPersona = await Persona.findOne({
        type: extracted.type,
        name: extracted.name
      });

      if (!existingPersona) {
        // Create new persona
        const newPersona = new Persona({
          type: extracted.type,
          name: extracted.name,
          age: extracted.age,
          gender: extracted.gender.toLowerCase(),
          interests: extracted.interests || []
        });

        await newPersona.save();
        console.log(`✅ Auto-saved new persona: ${extracted.name} (${extracted.type})`);
      } else {
        // Update existing persona with new information
        if (extracted.interests && extracted.interests.length > 0) {
          existingPersona.interests = [...new Set([...existingPersona.interests, ...extracted.interests])];
        }
        existingPersona.age = extracted.age;
        existingPersona.gender = extracted.gender.toLowerCase();
        await existingPersona.save();
        console.log(`✅ Updated existing persona: ${extracted.name} (${extracted.type})`);
      }
    }
  } catch (error) {
    console.error('Error extracting persona:', error);
    // Don't throw - this is a background task
  }
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

    // Extract the last user message for persona extraction
    const lastUserMessage = !isFirstMessage && messages && messages.length > 0
      ? messages[messages.length - 1].content
      : '';

    // Try to extract and save persona information in the background
    if (lastUserMessage) {
      extractAndSavePersona(aiResponse, lastUserMessage).catch(err => {
        console.error('Background persona extraction failed:', err);
      });
    }

    // Check for product trigger
    let showProducts = null;
    let cleanResponse = aiResponse;

    // Updated regex to support hyphens in category names (e.g., running-gear, board-games)
    const productMatch = aiResponse.match(/\[SHOW_PRODUCTS:([\w-]+)\]/);
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
      // Updated regex to support hyphens in category names
      cleanResponse = aiResponse.replace(/\[SHOW_PRODUCTS:[\w-]+\]/, '').trim();
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

