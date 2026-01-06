import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Star, RotateCcw, AudioWaveform, User, Cake, Heart, Sparkles } from 'lucide-react';
import { AILoadingOverlay } from '@/components/AILoadingOverlay';
import { TypingMessage } from '@/components/enhance/TypingMessage';
import sourDillLogo from '@/assets/sour-dillmas-logo.png';
import { getPersonaByType, savePersona, getPersonasByType, type Persona } from '@/services/personaService';
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
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<string>('');
  const [userMentionedCategory, setUserMentionedCategory] = useState(false);
  const [friendsList, setFriendsList] = useState<Persona[]>([]);
  const [matchingFriends, setMatchingFriends] = useState<Persona[]>([]);

  // Persona Creation State
  const [personaName, setPersonaName] = useState('');
  const [personaAge, setPersonaAge] = useState(30);
  const [personaGender, setPersonaGender] = useState('');
  const [personaInterests, setPersonaInterests] = useState<string[]>([]);

  // Product Search State
  const [selectedBudget, setSelectedBudget] = useState(500);
  const [priceRange, setPriceRange] = useState({ min: 50, max: 1000 });
  const [products, setProducts] = useState<Product[]>([]);
  const [showSecondOption, setShowSecondOption] = useState(false);

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
          setFlowStep('checking_persona');
          setIsTyping(true);
          setLoadingMessage(`SweetDill AI is retrieving historical data on ${detected}...`);

          setTimeout(async () => {
            const persona = await getPersonaByType(detected);
            setIsTyping(false);

            if (persona) {
              setCurrentPersona(persona);
              setPersonaName(persona.name);
              setFlowStep('persona_found');
              addAIMessage(`Great! I found some information about ${persona.name}. ${persona.name} is ${persona.age} years old and interested in ${persona.interests.slice(0, 2).join(', ')}. Do you have any category in mind or you want me to suggest something for ${persona.name}?`);
            } else {
              setFlowStep('persona_not_found');
              setIsTyping(true);
              setLoadingMessage(`SweetDill AI could not find any info on ${detected}...`);

              setTimeout(() => {
                setIsTyping(false);
                addAIMessage(`I couldn't find any information about your ${detected}. Please describe them - full name, age, gender, and interests (e.g., "John Smith, 35, male, loves cooking and hiking")`);
                setFlowStep('creating_persona_description');
              }, 3500);
            }
          }, 3500);
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

        // Find friends matching the first name
        const matches = allFriends.filter(f =>
          f.name.toLowerCase().includes(friendName.toLowerCase())
        );

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
      // User provided last name to disambiguate
      const lastName = userInput.toLowerCase();
      const match = matchingFriends.find(f =>
        f.name.toLowerCase().includes(lastName)
      );

      if (match) {
        setCurrentPersona(match);
        setPersonaName(match.name);
        setFlowStep('persona_found');
        addAIMessage(`Perfect! I found ${match.name}. ${match.name} is ${match.age} years old and interested in ${match.interests.slice(0, 2).join(', ')}. Do you have any category in mind or you want me to suggest something for ${match.name}?`);
      } else {
        addAIMessage(`I couldn't find a match. Let me ask again - which friend are you shopping for? ${matchingFriends.map(f => f.name).join(', ')}`);
      }
    } else if (flowStep === 'creating_persona_description') {
      // Parse the description: "John Smith, 35, male, loves cooking and hiking"
      const parts = userInput.split(',').map(p => p.trim());

      if (parts.length >= 3) {
        const name = parts[0];
        const age = parseInt(parts[1]);
        const gender = parts[2].toLowerCase();
        const interests = parts.slice(3).join(',').split(/and|,/).map(i => i.trim()).filter(i => i);

        setPersonaName(name);
        setPersonaAge(age);
        setPersonaGender(gender);
        setPersonaInterests(interests.length > 0 ? interests : ['general']);

        // Save persona
        setIsTyping(true);
        setLoadingMessage("Saving persona information...");

        setTimeout(async () => {
          const savedPersona = await savePersona({
            type: personaType,
            name,
            age: isNaN(age) ? 30 : age,
            gender: gender || 'other',
            interests: interests.length > 0 ? interests : ['general']
          });

          if (savedPersona) {
            setCurrentPersona(savedPersona);
          }

          setIsTyping(false);
          setFlowStep('asking_category');
          addAIMessage(`Perfect! Do you have any category in mind or you want me to suggest something for ${name}?`);
        }, 2000);
      } else {
        addAIMessage("Please provide the information in this format: Full Name, Age, Gender, Interests (e.g., 'John Smith, 35, male, cooking and hiking')");
      }
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
            'grills': ['cooking', 'grilling', 'bbq', 'outdoor', 'food', 'chef', 'grill'],
            'watches': ['time', 'watch', 'fitness', 'tech', 'smartwatch', 'health'],
            'skechers': ['walking', 'shoes', 'comfort', 'travel', 'running', 'fitness'],
            'jewellery': ['jewelry', 'jewellery', 'fashion', 'accessories', 'elegant'],
            'clothing': ['fashion', 'clothes', 'style', 'apparel', 'wear']
          };

          // Score each category
          const scores = Object.entries(categoryMap).map(([category, keywords]) => {
            const score = interests.filter(interest =>
              keywords.some(kw => interest.toLowerCase().includes(kw))
            ).length;
            return { category, score };
          });

          // Get top 3 categories
          const top3 = scores
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(s => s.category);

          const categoriesText = top3.map((cat, i) => `${i + 1}. ${cat.charAt(0).toUpperCase() + cat.slice(1)}`).join('\n');

          addAIMessage(`Based on ${personaName}'s interests, here are the best categories:\n\n${categoriesText}\n\nWhich one would you like to explore?`);
          setFlowStep('asking_category');
        }, 3500);
      } else {
        // User mentioned category - detect it
        const categoryKeywords: Record<string, string[]> = {
          'grills': ['grill', 'bbq', 'barbecue'],
          'watches': ['watch', 'smartwatch', 'timepiece'],
          'skechers': ['skechers', 'shoes', 'sneakers', 'footwear'],
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
              products: transformedProducts.slice(0, 2)
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
              products: transformedProducts.slice(0, 2)
            });
          } else {
            addAIMessage(`Still no results. Let's try a different category or price range. What else would work for ${personaName}?`);
          }
        }, 8000);
      } else {
        // User mentioned features or other preferences
        addAIMessage(`I understand you're looking for ${userInput}. Let me search with a broader price range to find the best match!`);
        setFlowStep('searching_products');
        setShowDetailedLoading(true);

        setTimeout(async () => {
          const fetchedProducts = await getProductsByCategory(detectedCategory, selectedBudget * 2);
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
              products: transformedProducts.slice(0, 2)
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

  // Detailed loading screen component
  const DetailedLoadingScreen = () => {
    const [currentStep, setCurrentStep] = useState(0);

    const [randomNumbers] = useState({
      resources: Math.floor(Math.random() * (37 - 19 + 1)) + 19,
      reviews: Math.floor(Math.random() * (9 - 3 + 1)) + 3,
    });

    const categoryName = detectedCategory || 'products';
    const steps = [
      { icon: '🔍', text: `Checking ${randomNumbers.resources} resources for ${categoryName}`, duration: 1200 },
      { icon: '⭐', text: `Checking ${randomNumbers.reviews} resources for customer reviews on ${categoryName}`, duration: 1200 },
      { icon: '💰', text: 'Finding the best deals', duration: 1200 },
      { icon: '📊', text: 'Evaluating product attributes', duration: 1200 },
      { icon: '💵', text: 'Comparing prices', duration: 1200 },
      { icon: '↩️', text: 'Checking return rates', duration: 1200 },
    ];

    useEffect(() => {
      if (!showDetailedLoading) {
        setCurrentStep(0);
        return;
      }

      let totalDelay = 0;
      steps.forEach((step, index) => {
        setTimeout(() => {
          setCurrentStep(index + 1);
        }, totalDelay);
        totalDelay += step.duration;
      });
    }, [showDetailedLoading]);

    if (!showDetailedLoading) return null;

    const progress = ((currentStep) / steps.length) * 100;

    return (
      <div className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center px-6 rounded-xl">
        {/* Logo */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-2xl">
              <img src={sourDillLogo} alt="Sweet Dill" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground mb-2 text-center capitalize">
          Finding Best {categoryName}
        </h2>
        <p className="text-sm text-muted-foreground mb-8 text-center">
          Please wait while we search...
        </p>

        {/* Current Step Display */}
        <div className="mb-8 text-center min-h-[120px] flex items-center justify-center">
          {currentStep > 0 && currentStep <= steps.length && (
            <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
              <div className="text-5xl animate-bounce">
                {steps[currentStep - 1].icon}
              </div>
              <p className="text-sm font-semibold text-foreground px-4">
                {steps[currentStep - 1].text}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs">
          <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs font-medium text-primary">
            {Math.round(progress)}%
          </p>
        </div>

        {/* Step Dots */}
        <div className="flex gap-2 mt-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index < currentStep
                  ? 'bg-primary scale-110'
                  : index === currentStep
                  ? 'bg-accent scale-125 animate-pulse'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      {showDetailedLoading ? (
        <DetailedLoadingScreen />
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

            {/* Product Cards */}
            {message.showProducts && message.products && (
              <>
                {/* Product display - show max 2 products, centered */}
                <div className="flex flex-col items-center gap-4">
                  {(showSecondOption ? message.products.slice(0, 2) : message.products.slice(0, 1)).map((product, index) => (
                    <a
                      key={product.id}
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full max-w-[280px] bg-card border-2 border-primary/30 rounded-2xl p-4 hover:shadow-xl transition-all cursor-pointer hover:border-primary hover:scale-[1.02] block group"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-secondary/30 relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground line-clamp-2 mb-2">
                        {product.name}
                      </h4>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg font-bold text-primary">${product.price}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-muted-foreground font-medium">{product.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{product.store}</p>
                    </a>
                  ))}
                </div>

                {/* Show Second Premium Option button */}
                {!showSecondOption && message.products.length >= 2 && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => setShowSecondOption(true)}
                      className="relative px-8 py-4 text-base font-bold text-white rounded-full overflow-hidden group shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center gap-2">
                        Show Second Premium Option
                        <span className="text-xl">✨</span>
                      </span>
                    </button>
                  </div>
                )}
              </>
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
