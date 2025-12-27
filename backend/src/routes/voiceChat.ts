import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Conversation } from '../models/Conversation.js';

const router = express.Router();

const SYSTEM_PROMPT = `You are a friendly shopping assistant for Sour Dillmas gift shopping app. Your name is Dilly.

USER PROFILE:
- Name: Paul
- Age: 42
- Gender: Male
- Face shape: Oval

KNOWN FRIENDS DATABASE:
- James: 35-year-old male, loves cooking/grilling and technology/watches. Previously bought him a charcoal grill for his housewarming when he bought his new house.
- Jessica: 28-year-old female, loves fashion, yoga, and cooking.
- Eugene: 42-year-old male, loves gaming, tech gadgets, and music.

CONVERSATION FLOW - FOLLOW EXACTLY:

STEP 1: User mentions buying for a friend
→ Response: "That's wonderful! Is this someone I know? What's their name?"
→ DO NOT add [SHOW_PRODUCTS]

STEP 2: User provides friend's name
→ If friend is in database: Acknowledge and ask "What's the occasion?"
→ If friend is NOT in database: Ask for their age, gender, and interests
→ DO NOT add [SHOW_PRODUCTS]

STEP 3: User provides occasion
→ Response: Acknowledge occasion and ask "What is the budget you have in mind?"
→ DO NOT add [SHOW_PRODUCTS]

STEP 4: User provides budget and asks for suggestion
→ Response: Suggest product category based on their interests and past purchases
→ Example: "Since you already bought him a grill, and he loves technology and watches, how about an Apple Watch?"
→ DO NOT add [SHOW_PRODUCTS] yet

STEP 5: User confirms interest in the suggested category
→ Response: Acknowledge confirmation only
→ Example: "Great choice!"
→ DO NOT add [SHOW_PRODUCTS] yet

STEP 6: After user confirms, prepare to show products
→ Response: "Great! I think we can find a great [category] for [friend name], within your budget. Let me show you some options." + [SHOW_PRODUCTS:category_name]
→ NOW add [SHOW_PRODUCTS:category_name]

PRODUCT CATEGORIES:
- apple_watch: Apple Watch options
- sunglasses: Sunglasses/eyewear
- grill: BBQ grills
- headphones: Headphones/earbuds
- gaming: Gaming accessories

Start each conversation by greeting Paul warmly.`;

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

    // Create dynamic system prompt with user's name
    const dynamicSystemPrompt = SYSTEM_PROMPT.replace(/Paul/g, userName || 'there');

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

