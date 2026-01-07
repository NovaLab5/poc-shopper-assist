import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Star, RotateCcw, AudioWaveform, User, Cake, Heart, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { AILoadingOverlay } from '@/components/AILoadingOverlay';
import { TypingMessage } from '@/components/enhance/TypingMessage';
import { ProductResultsDisplay, type ProductItem } from '@/components/shared/ProductResultsDisplay';
import { ProductSearchLoadingScreen } from '@/components/shared/ProductSearchLoadingScreen';
import sourDillLogo from '@/assets/sour-dillmas-logo.png';
import { usePersona } from '@/hooks/usePersona';
import { getPersonasByType, type Persona } from '@/services/personaService';
import { getProductsByCategory, getCategoryPriceRange, transformProductsForComponent } from '@/services/productService';
import { Slider } from '@/components/ui/slider';

interface Product {
  id: string;
  name: string;
  price: number;
  store: string;
  image: string;
  rating: number;
  url?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  showProducts?: boolean;
  products?: Product[];
  isNew?: boolean;
  showAllProducts?: boolean;
  triggerLoading?: boolean;
  showPersonaForm?: boolean;
  showPriceInput?: boolean;
}

interface ChatState {
  messages: Message[];
  conversationIndex: number;
  messageIndex: number;
}

interface ChatInterfaceProps {
  onBack: () => void;
  getChatState: () => ChatState;
  setChatState: (messages: Message[], convIndex: number, msgIndex: number) => void;
  onReset?: () => void;
  onSwitchToVoice?: () => void;
}

// Chat flow steps
type ChatFlowStep =
  | 'initial'
  | 'waiting_persona_input'
  | 'checking_persona'
  | 'persona_not_found'
  | 'persona_found'
  | 'asking_friend_name'
  | 'checking_friend_name'
  | 'asking_friend_last_name'
  | 'creating_persona_description'
  | 'asking_category'
  | 'asking_price'
  | 'searching_products'
  | 'showing_results'
  | 'no_results_refining';

// Levenshtein distance for fuzzy string matching
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

// Calculate similarity score (0-1, where 1 is exact match)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1.0;

  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);

  // Convert distance to similarity (0-1)
  return 1 - (distance / maxLen);
}

// Fuzzy match personas by name
function fuzzyMatchPersonas(input: string, personas: Persona[]): Persona[] {
  const inputLower = input.toLowerCase().trim();

  // First, check for exact match
  const exactMatch = personas.find(p => p.name.toLowerCase() === inputLower);
  if (exactMatch) {
    return [exactMatch];
  }

  // Score each persona
  const scored = personas.map(persona => {
    const fullName = persona.name.toLowerCase();
    const nameParts = fullName.split(' ');
    const inputParts = inputLower.split(' ');

    // Calculate best match score
    let bestScore = 0;

    // Check full name similarity
    const fullNameScore = calculateSimilarity(inputLower, fullName);
    bestScore = Math.max(bestScore, fullNameScore);

    // Bonus for exact full name match
    if (inputLower === fullName) {
      bestScore = 1.0;
    }

    // Check if all input parts have good matches in name parts
    if (inputParts.length > 1 && nameParts.length > 1) {
      const partScores = inputParts.map(inputPart => {
        return Math.max(...nameParts.map(namePart =>
          calculateSimilarity(inputPart, namePart)
        ));
      });
      const avgScore = partScores.reduce((a, b) => a + b, 0) / partScores.length;

      // If all parts match well, give high score
      if (partScores.every(s => s >= 0.8)) {
        bestScore = Math.max(bestScore, avgScore * 1.1); // Boost multi-part matches
      } else {
        bestScore = Math.max(bestScore, avgScore);
      }
    }

    // Penalty for length mismatch (prefer names closer in length)
    const lengthRatio = Math.min(inputLower.length, fullName.length) / Math.max(inputLower.length, fullName.length);
    const lengthPenalty = 1 - (1 - lengthRatio) * 0.2; // Max 20% penalty
    bestScore *= lengthPenalty;

    return { persona, score: bestScore };
  });

  // Filter by threshold (0.6 = 60% similarity)
  const threshold = 0.6;
  const matches = scored
    .filter(s => s.score >= threshold)
    .sort((a, b) => {
      // Sort by score descending
      if (Math.abs(a.score - b.score) > 0.01) {
        return b.score - a.score;
      }
      // If scores are very close, prefer longer names (more specific)
      return b.persona.name.length - a.persona.name.length;
    })
    .map(s => s.persona);

  // If we have multiple matches and one is significantly better, only return that one
  if (matches.length > 1) {
    const topScore = scored.find(s => s.persona === matches[0])?.score || 0;
    const secondScore = scored.find(s => s.persona === matches[1])?.score || 0;

    // If top match is significantly better (>15% better), only return it
    if (topScore - secondScore > 0.15) {
      return [matches[0]];
    }
  }

  return matches;
}

export function ChatInterface({ onBack, getChatState, setChatState, onReset, onSwitchToVoice }: ChatInterfaceProps) {
  // UI State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAITypingAnimation, setIsAITypingAnimation] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showDetailedLoading, setShowDetailedLoading] = useState(false);

  // Flow State
  const [flowStep, setFlowStep] = useState<ChatFlowStep>('initial');
  const [personaType, setPersonaType] = useState<string>('');
  const [detectedCategory, setDetectedCategory] = useState<string>('');
  const [userMentionedCategory, setUserMentionedCategory] = useState(false);
  const [friendsList, setFriendsList] = useState<Persona[]>([]);
  const [matchingFriends, setMatchingFriends] = useState<Persona[]>([]);

  // Persona Creation State
  const [personaName, setPersonaName] = useState('');
  const [personaAge, setPersonaAge] = useState(30);
  const [personaGender, setPersonaGender] = useState('');
  const [personaInterests, setPersonaInterests] = useState<string[]>([]);

  // Use centralized persona hook
  const {
    currentPersona,
    loadPersona,
    savePersona: savePersonaHook,
    clearPersona
  } = usePersona();

  // Product Search State
  const [selectedBudget, setSelectedBudget] = useState(500);
  const [priceRange, setPriceRange] = useState({ min: 50, max: 1000 });
  const [products, setProducts] = useState<Product[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);

  // Initialize chat with greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greetingMessage: Message = {
        id: '1',
        role: 'assistant',
        content: "Hey! What are you looking for today? How can I help you?",
        isNew: true
      };
      setMessages([greetingMessage]);
      setIsAITypingAnimation(true);
      setFlowStep('waiting_persona_input');
    }
  }, []);

  // Helper to extract persona type from user input
  const extractPersonaType = (text: string): string => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('mother') || lowerText.includes('mom')) return 'mother';
    if (lowerText.includes('father') || lowerText.includes('dad')) return 'father';
    if (lowerText.includes('friend')) return 'friend';
    if (lowerText.includes('brother')) return 'brother';
    if (lowerText.includes('sister')) return 'sister';
    if (lowerText.includes('wife')) return 'wife';
    if (lowerText.includes('husband')) return 'husband';
    return '';
  };

  // Helper to add AI message
  const addAIMessage = (content: string, options?: Partial<Message>) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      isNew: true,
      ...options
    };
    setMessages(prev => [...prev.map(m => ({ ...m, isNew: false })), newMessage]);
    setIsAITypingAnimation(true);
  };

  const scrollToBottom = () => {
    if (!isUserScrolling.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      isUserScrolling.current = !isAtBottom;
    }
  };

  useEffect(() => {
    const hasNewMessage = messages.some(m => m.isNew);
    if (hasNewMessage) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length]);

  const handleTypingComplete = (messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, isNew: false } : m
    ));
    setIsAITypingAnimation(false);
  };



  const handleSwitchToVoice = () => {
    if (isTyping || showDetailedLoading || isAITypingAnimation) return;
    setIsTyping(true);
    setLoadingMessage("SweetDill is preparing the agent to talk to you...");
    setTimeout(() => {
      setIsTyping(false);
      if (onSwitchToVoice) {
        onSwitchToVoice();
      }
    }, 5500);
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping || showDetailedLoading || isAITypingAnimation) return;

    const userInput = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      isNew: false
    };

    setMessages(prev => [...prev.map(m => ({ ...m, isNew: false })), userMessage]);
    setInput('');

    // Handle based on current flow step
    if (flowStep === 'waiting_persona_input') {
      // Extract persona type from input
      const detected = extractPersonaType(userInput);
      if (detected) {
        setPersonaType(detected);

        // Special handling for "friend" - ask for name first
        if (detected === 'friend') {
          setFlowStep('asking_friend_name');
          addAIMessage("What's your friend's name?");
        } else {
          // USE CENTRALIZED PERSONA RECOGNITION
          setFlowStep('checking_persona');
          setIsTyping(true);
          setLoadingMessage(`Checking if I know your ${detected}...`);

          setTimeout(async () => {
            const result = await loadPersona(detected);
            setIsTyping(false);

            if (result.found && result.persona) {
              // Persona found! Skip all questions
              setPersonaName(result.persona.name);
              setFlowStep('persona_found');
              addAIMessage(`Great! Shopping for ${result.persona.name}. I remember ${result.persona.name} is ${result.persona.age} years old and loves ${result.persona.interests.slice(0, 2).join(', ')}. Do you have any category in mind or want me to suggest something?`);
            } else {
              // Persona not found - need to collect info
              setFlowStep('persona_not_found');
              setIsTyping(true);
              setLoadingMessage(`No information found for ${detected}...`);

              setTimeout(() => {
                setIsTyping(false);
                addAIMessage(`I don't have information about your ${detected} yet. Tell me about them - what's their name, age, and what do they love?`);
                setFlowStep('creating_persona_description');
              }, 1000);
            }
          }, 800); // Faster response
        }
      } else {
        addAIMessage("I'm not sure who you're shopping for. Could you please specify? (e.g., mother, friend, father)");
      }
    } else if (flowStep === 'asking_friend_name') {
      // User provided friend's first name
      const friendName = userInput;
      setPersonaName(friendName);
      setFlowStep('checking_friend_name');
      setIsTyping(true);
      setLoadingMessage(`SweetDill AI is checking for ${friendName}...`);

      setTimeout(async () => {
        // Get all friends from DB
        const allFriends = await getPersonasByType('friend');
        setFriendsList(allFriends);

        // Use fuzzy matching to find friends
        const matches = fuzzyMatchPersonas(friendName, allFriends);

        setIsTyping(false);

        if (matches.length === 0) {
          // No friend found - create new
          setFlowStep('creating_persona_description');
          addAIMessage(`I couldn't find ${friendName} in your friends list. Let's add them! Please describe ${friendName} - full name, age, gender, and interests (e.g., "John Smith, 35, male, loves cooking and hiking")`);
        } else if (matches.length === 1) {
          // Exactly one match - use it
          const friend = matches[0];
          setCurrentPersona(friend);
          setPersonaName(friend.name);
          setFlowStep('persona_found');
          addAIMessage(`Great! I found ${friend.name}. ${friend.name} is ${friend.age} years old and interested in ${friend.interests.slice(0, 2).join(', ')}. Do you have any category in mind or you want me to suggest something for ${friend.name}?`);
        } else {
          // Multiple matches - ask for last name
          setMatchingFriends(matches);
          setFlowStep('asking_friend_last_name');
          const friendNames = matches.map(f => f.name).join(', ');
          addAIMessage(`I found multiple friends named ${friendName}: ${friendNames}. Can you provide the last name?`);
        }
      }, 3500);
    } else if (flowStep === 'asking_friend_last_name') {
      // User provided last name to disambiguate - use fuzzy matching
      const matches = fuzzyMatchPersonas(userInput, matchingFriends);
      const match = matches.length > 0 ? matches[0] : null;

      if (match) {
        setCurrentPersona(match);
        setPersonaName(match.name);
        setFlowStep('persona_found');
        addAIMessage(`Perfect! I found ${match.name}. ${match.name} is ${match.age} years old and interested in ${match.interests.slice(0, 2).join(', ')}. Do you have any category in mind or you want me to suggest something for ${match.name}?`);
      } else {
        addAIMessage(`I couldn't find a match. Let me ask again - which friend are you shopping for? ${matchingFriends.map(f => f.name).join(', ')}`);
      }
    } else if (flowStep === 'creating_persona_description') {
      // Smart parsing - handle natural language input
      // Examples:
      // "Zahra Juju she is 41 and love laptop and food"
      // "She is Zahra morche, she loves dance and laptops"
      // "John Smith, 35, male, loves cooking and hiking"

      const input = userInput.toLowerCase();

      // Extract name - skip pronouns (he/she/his/her) and find actual name
      let name = '';

      // Remove common pronouns and filler words from the start
      const cleanedInput = userInput.replace(/^(She is|He is|she is|he is|She's|He's|she's|he's)\s+/i, '');

      // Split by common stop words and take the name part
      const stopWords = /\s+(she|he|and|is|was|loves?|likes?|enjoys?|interested|age|years?|old|male|female|,|\d)/i;
      const beforeStop = cleanedInput.split(stopWords)[0].trim();

      // Take first 2-3 words as name and clean up punctuation
      const nameParts = beforeStop.split(/\s+/).filter(w => w.length > 0);
      name = nameParts.slice(0, 3).join(' ').replace(/[,;.!?]+$/, '').trim();

      // If no name found, use fallback
      if (!name || name.length < 2) {
        const words = cleanedInput.split(/\s+/);
        name = words.slice(0, 2).join(' ').replace(/[,;.!?]+$/, '').trim();
      }

      // Extract age (any number between 1-120)
      const ageMatch = input.match(/\b(\d{1,3})\b/);
      const age = ageMatch ? parseInt(ageMatch[1]) : 30;

      // Extract gender (male, female, or detect from pronouns)
      let gender = 'other';
      if (input.includes('she ') || input.includes('she is') || input.includes('her ') || input.includes('female')) {
        gender = 'female';
      } else if (input.includes('he ') || input.includes('he is') || input.includes('his ') || input.includes('male')) {
        gender = 'male';
      }

      // Extract interests (words after "love", "loves", "interested in", "likes")
      const interestPatterns = [
        /(?:love|loves|loving)\s+([^,.]+)/gi,
        /(?:interested in|interest in)\s+([^,.]+)/gi,
        /(?:like|likes|liking)\s+([^,.]+)/gi,
        /(?:enjoy|enjoys|enjoying)\s+([^,.]+)/gi
      ];

      const interests: string[] = [];
      interestPatterns.forEach(pattern => {
        const matches = input.matchAll(pattern);
        for (const match of matches) {
          const items = match[1].split(/\s+and\s+|\s*,\s*/);
          interests.push(...items.map(i => i.trim()).filter(i => i && i.length > 2));
        }
      });

      console.log('📝 Parsed persona:', { name, age, gender, interests });

      setPersonaName(name);
      setPersonaAge(age);
      setPersonaGender(gender);
      setPersonaInterests(interests.length > 0 ? interests : ['general']);

      // Save persona using centralized hook
      setIsTyping(true);
      setLoadingMessage("Saving persona information...");

      setTimeout(async () => {
        console.log('💾 Saving persona:', { type: personaType, name, age, gender, interests });

        await savePersonaHook({
          type: personaType,
          name,
          age: isNaN(age) ? 30 : age,
          gender: gender || 'other',
          interests: interests.length > 0 ? interests : ['general']
        });

        setIsTyping(false);
        setFlowStep('asking_category');
        addAIMessage(`Perfect! I'll remember ${name} for next time. Do you have any category in mind or want me to suggest something for ${name}?`);
      }, 1500);
    } else if (flowStep === 'persona_found' || flowStep === 'asking_category') {
      // Check if user mentioned a category or wants AI to suggest
      const lowerInput = userInput.toLowerCase();

      if (lowerInput.includes('suggest') || lowerInput.includes('choose') || lowerInput.includes('pick')) {
        // AI suggests 3 categories based on persona interests
        setFlowStep('searching_products');
        setIsTyping(true);
        setLoadingMessage(`SweetDill AI shopping expert is analyzing ${personaName}'s interests...`);

        setTimeout(() => {
          setIsTyping(false);

          // Map interests to categories
          const interests = currentPersona?.interests || personaInterests;
          const categoryMap: Record<string, string[]> = {
            'grills': ['cooking', 'grilling', 'bbq', 'outdoor', 'food', 'chef', 'grill', 'barbecue', 'meat', 'hosting'],
            'watches': ['time', 'watch', 'fitness', 'tech', 'smartwatch', 'health', 'tracking', 'wearable', 'apple watch'],
            'headphones': ['music', 'audio', 'sound', 'listening', 'headphones', 'earbuds', 'podcast', 'gaming'],
            'laptops': ['computer', 'laptop', 'work', 'programming', 'coding', 'tech', 'productivity', 'student', 'business'],
            'smartphones': ['phone', 'mobile', 'smartphone', 'tech', 'communication', 'apps', 'social media'],
            'camera': ['photography', 'photo', 'camera', 'pictures', 'video', 'vlogging', 'content creation', 'travel'],
            'tv': ['tv', 'television', 'movies', 'streaming', 'entertainment', 'gaming', 'home theater'],
            'running-gear': ['running', 'jogging', 'marathon', 'fitness', 'exercise', 'cardio', 'athletic'],
            'board-games': ['games', 'board games', 'family', 'fun', 'entertainment', 'social', 'party'],
            'travel-gear-and-accessories': ['travel', 'vacation', 'adventure', 'backpacking', 'luggage', 'trip', 'exploring'],
            'home-office-furniture-and-supplies': ['work', 'office', 'desk', 'home office', 'productivity', 'remote work', 'ergonomic'],
            'luxurious-gifts': ['luxury', 'premium', 'high-end', 'elegant', 'sophisticated', 'exclusive'],
            'self-care-gifts-for-yourself': ['self-care', 'wellness', 'relaxation', 'spa', 'meditation', 'mindfulness', 'health'],
            'socks': ['socks', 'comfort', 'cozy', 'feet', 'warm'],
            'pajamas': ['sleep', 'pajamas', 'comfort', 'relaxation', 'bedtime', 'loungewear'],
            'jewellery': ['jewelry', 'jewellery', 'fashion', 'accessories', 'elegant', 'style', 'necklace', 'bracelet'],
            'clothing': ['fashion', 'clothes', 'style', 'apparel', 'wear', 'outfit', 'wardrobe']
          };

          // Score each category
          const scores = Object.entries(categoryMap).map(([category, keywords]) => {
            const score = interests.filter(interest =>
              keywords.some(kw => interest.toLowerCase().includes(kw))
            ).length;
            return { category, score };
          });

          // Get top 3 categories with score > 0, or fallback to generic suggestions
          const scoredCategories = scores.filter(s => s.score > 0).sort((a, b) => b.score - a.score);

          let top3: string[];
          if (scoredCategories.length >= 3) {
            // We have 3+ matches, use top 3
            top3 = scoredCategories.slice(0, 3).map(s => s.category);
          } else if (scoredCategories.length > 0) {
            // We have 1-2 matches, use them and fill with popular categories
            const matched = scoredCategories.map(s => s.category);
            const fallbacks = ['luxurious-gifts', 'self-care-gifts-for-yourself', 'travel-gear-and-accessories']
              .filter(cat => !matched.includes(cat));
            top3 = [...matched, ...fallbacks].slice(0, 3);
          } else {
            // No matches, use generic popular categories
            top3 = ['luxurious-gifts', 'self-care-gifts-for-yourself', 'travel-gear-and-accessories'];
          }

          // Format category names nicely (replace hyphens with spaces, capitalize words)
          const formatCategoryName = (cat: string) => {
            return cat
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          };

          const categoriesText = top3.map((cat, i) => `${i + 1}. ${formatCategoryName(cat)}`).join('\n');

          addAIMessage(`Based on ${personaName}'s interests, here are the best categories:\n\n${categoriesText}\n\nWhich one would you like to explore?`);
          setFlowStep('asking_category');
        }, 3500);
      } else {
        // User mentioned category - detect it
        const categoryKeywords: Record<string, string[]> = {
          'grills': ['grill', 'bbq', 'barbecue'],
          'watches': ['watch', 'smartwatch', 'timepiece'],
          'headphones': ['headphone', 'earbuds', 'airpods', 'audio'],
          'laptops': ['laptop', 'computer', 'macbook', 'notebook'],
          'smartphones': ['phone', 'smartphone', 'iphone', 'android'],
          'camera': ['camera', 'photography', 'photo'],
          'tv': ['tv', 'television', 'screen'],
          'running-gear': ['running', 'jogging', 'athletic'],
          'board-games': ['board game', 'game', 'tabletop'],
          'travel-gear-and-accessories': ['travel', 'luggage', 'backpack'],
          'home-office-furniture-and-supplies': ['office', 'desk', 'chair', 'workspace'],
          'luxurious-gifts': ['luxury', 'premium', 'high-end'],
          'self-care-gifts-for-yourself': ['self-care', 'wellness', 'spa'],
          'socks': ['socks'],
          'pajamas': ['pajamas', 'sleepwear', 'loungewear'],
          'jewellery': ['jewelry', 'jewellery', 'necklace', 'bracelet', 'ring'],
          'clothing': ['clothes', 'clothing', 'apparel', 'shirt', 'pants', 'sweater']
        };

        let detected = '';
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(kw => lowerInput.includes(kw))) {
            detected = category;
            break;
          }
        }

        if (detected) {
          setDetectedCategory(detected);
          setUserMentionedCategory(true);
          setFlowStep('asking_price');
          addAIMessage("Great choice! What's your price range?");
        } else {
          // No category detected - ask again
          addAIMessage("I didn't catch that. Which category would you like? (e.g., grills, watches, skechers, jewellery, clothing)");
        }
      }
    } else if (flowStep === 'asking_price') {
      // Extract price from input
      const priceMatch = userInput.match(/\d+/);
      if (priceMatch) {
        const budget = parseInt(priceMatch[0]);
        setSelectedBudget(budget);

        // Search for products
        setFlowStep('searching_products');
        setShowDetailedLoading(true);

        setTimeout(async () => {
          const fetchedProducts = await getProductsByCategory(detectedCategory, budget);

          // Sort by price DESC (most premium first)
          const transformedProducts = fetchedProducts
            .map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              store: p.brand,
              image: p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
              rating: p.rating || 4.5,
              url: p.amazonUrl
            }))
            .sort((a, b) => b.price - a.price); // Premium (higher price) first

          setProducts(transformedProducts);
          setShowDetailedLoading(false);

          if (transformedProducts.length > 0) {
            setFlowStep('showing_results');
            addAIMessage("Here are the best options I found for you:", {
              showProducts: true,
              products: transformedProducts // Pass all products so we can show upgrade/budget options
            });
          } else {
            setFlowStep('no_results_refining');
            addAIMessage(`I couldn't find any ${detectedCategory} in that price range. Let me help you find the perfect product! What features are most important to you? Or would you like to adjust your budget?`);
          }
        }, 8000);
      } else {
        addAIMessage("Please specify a price (e.g., $500 or 500)");
      }
    } else if (flowStep === 'no_results_refining') {
      // User is refining search after no results
      const lowerInput = userInput.toLowerCase();

      // Check if user wants to adjust budget
      const priceMatch = userInput.match(/\d+/);
      if (priceMatch || lowerInput.includes('budget') || lowerInput.includes('price')) {
        const newBudget = priceMatch ? parseInt(priceMatch[0]) : selectedBudget * 1.5;
        setSelectedBudget(newBudget);

        setFlowStep('searching_products');
        setShowDetailedLoading(true);

        setTimeout(async () => {
          const fetchedProducts = await getProductsByCategory(detectedCategory, newBudget);
          const transformedProducts = fetchedProducts
            .map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              store: p.brand,
              image: p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
              rating: p.rating || 4.5,
              url: p.amazonUrl
            }))
            .sort((a, b) => b.price - a.price);

          setProducts(transformedProducts);
          setShowDetailedLoading(false);

          if (transformedProducts.length > 0) {
            setFlowStep('showing_results');
            addAIMessage(`Great! I found some options with the adjusted budget:`, {
              showProducts: true,
              products: transformedProducts // Pass all products for upgrade/budget options
            });
          } else {
            addAIMessage(`Still no results. Let's try a different category or price range. What else would work for ${personaName}?`);
          }
        }, 8000);
      } else {
        // User mentioned features or other preferences
        const expandedBudget = selectedBudget * 2;
        setSelectedBudget(expandedBudget);

        addAIMessage(`I understand you're looking for ${userInput}. Let me search with a broader price range to find the best match!`);
        setFlowStep('searching_products');
        setShowDetailedLoading(true);

        setTimeout(async () => {
          const fetchedProducts = await getProductsByCategory(detectedCategory, expandedBudget);
          const transformedProducts = fetchedProducts
            .map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              store: p.brand,
              image: p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
              rating: p.rating || 4.5,
              url: p.amazonUrl
            }))
            .sort((a, b) => b.price - a.price);

          setProducts(transformedProducts);
          setShowDetailedLoading(false);

          if (transformedProducts.length > 0) {
            setFlowStep('showing_results');
            addAIMessage(`Here are some great options I found:`, {
              showProducts: true,
              products: transformedProducts // Pass all products for upgrade/budget options
            });
          } else {
            addAIMessage(`I'm having trouble finding ${detectedCategory} that match. Would you like to try a different category?`);
          }
        }, 8000);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isTyping || showDetailedLoading || isAITypingAnimation) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };



  return (
    <div className="flex flex-col h-full relative">
      {showDetailedLoading ? (
        <div className="absolute inset-0 z-50 bg-background rounded-xl">
          <ProductSearchLoadingScreen category={detectedCategory || 'products'} duration={7200} />
        </div>
      ) : (
        <AILoadingOverlay isVisible={isTyping} message={loadingMessage} />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 p-3 bg-card rounded-xl shadow-card border border-border/30 mb-3 shrink-0">
        <div className="flex-1">
          <h3 className="font-medium text-foreground text-sm">Dilly Chat</h3>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-full bg-secondary/50 flex items-center gap-1.5 hover:bg-secondary transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-foreground" />
            <span className="text-xs text-foreground font-medium">Start Over</span>
          </button>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 space-y-3 pb-4 scroll-smooth"
      >
        {messages.map((message) => (
          <div key={message.id}>
            {/* Only show message bubble if there's content */}
            {message.content && (
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-chat-user text-white rounded-br-sm'
                      : 'bg-chat-ai text-white rounded-bl-sm'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <TypingMessage
                      content={message.content}
                      shouldAnimate={message.isNew || false}
                      onTypingComplete={() => handleTypingComplete(message.id)}
                    />
                  ) : (
                    <p className="text-[15px] leading-relaxed whitespace-pre-line">{message.content}</p>
                  )}
                </div>
              </div>
            )}

            {/* Product Cards - Using Unified Component */}
            {message.showProducts && message.products && (
              <ProductResultsDisplay
                products={message.products as ProductItem[]}
                maxBudget={selectedBudget}
                onSomethingElse={() => {
                  // Go back to category selection - keep persona info
                  setFlowStep('asking_category');
                  setDetectedCategory('');
                  setUserMentionedCategory(false);
                  setSelectedBudget(500);
                  setProducts([]);

                  // Add message asking for new category
                  const newMessage: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `Let's find something else for ${personaName}! Do you have any category in mind or want me to suggest something?`,
                    isNew: true
                  };
                  setMessages(prev => [...prev, newMessage]);
                  setMatchingFriends([]);
                }}
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="shrink-0 py-3 bg-background">
        <div className="flex items-center gap-3">
          {/* Input field */}
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={(isTyping || showDetailedLoading || isAITypingAnimation) ? "AI is responding..." : flowStep === 'showing_results' ? "Results shown" : "Type your message..."}
              disabled={isTyping || showDetailedLoading || isAITypingAnimation || flowStep === 'showing_results'}
              className="w-full pl-4 pr-4 py-2.5 bg-secondary/30 border-0 rounded-3xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Blue waveform button - switches to voice mode */}
          <button
            onClick={handleSwitchToVoice}
            disabled={isTyping || showDetailedLoading || isAITypingAnimation || flowStep === 'showing_results'}
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg"
          >
            <AudioWaveform className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
