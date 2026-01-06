import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Star, RotateCcw, AudioWaveform, User, Cake, Heart, Sparkles } from 'lucide-react';
import { AILoadingOverlay } from '@/components/AILoadingOverlay';
import { TypingMessage } from '@/components/enhance/TypingMessage';
import sourDillLogo from '@/assets/sour-dillmas-logo.png';
import { getPersonaByType, savePersona, type Persona } from '@/services/personaService';
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
  | 'creating_persona_name'
  | 'creating_persona_age'
  | 'creating_persona_gender'
  | 'creating_persona_interests'
  | 'asking_category'
  | 'asking_price'
  | 'searching_products'
  | 'showing_results';

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

  // Persona Creation State
  const [personaName, setPersonaName] = useState('');
  const [personaAge, setPersonaAge] = useState(30);
  const [personaGender, setPersonaGender] = useState('');
  const [personaInterests, setPersonaInterests] = useState<string[]>([]);

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

  const scrollToBottom = () => {
    // Don't auto-scroll if user is manually scrolling
    if (!isUserScrolling.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Detect user scrolling
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

      // If user scrolls up, mark as user scrolling
      if (!isAtBottom) {
        isUserScrolling.current = true;
      } else {
        isUserScrolling.current = false;
      }
    }
  };

  // Only auto-scroll when a NEW message is added (not when existing messages update)
  useEffect(() => {
    const hasNewMessage = messages.some(m => m.isNew);
    if (hasNewMessage) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length]); // Only trigger on message count change

  // Scroll once when products first appear
  useEffect(() => {
    const hasProducts = messages.some(m => m.showProducts && m.products);
    if (hasProducts && !hasScrolledForProducts.current) {
      hasScrolledForProducts.current = true;
      // Delay to allow images to load
      setTimeout(scrollToBottom, 800);
    }
  }, [messages]);



  const handleSwitchToVoice = () => {
    if (isTyping || showDetailedLoading || isAITypingAnimation) return;

    // Show loading screen for 5-6 seconds
    setIsTyping(true);
    setLoadingMessage("SweetDill is preparing the agent to talk to you...");

    setTimeout(() => {
      setIsTyping(false);
      if (onSwitchToVoice) {
        onSwitchToVoice();
      }
    }, 5500); // 5.5 seconds
  };

  const toggleVoiceRecording = () => {
    if (isTyping || showDetailedLoading || isAITypingAnimation) return;

    if (!isListening) {
      // Start listening
      setIsListening(true);
      // In a real implementation, you would start actual voice recording here
    } else {
      // Stop listening and simulate voice input
      setIsListening(false);
      // Simulate voice-to-text conversion
      // In a real implementation, you would process the recorded audio here
      const simulatedVoiceInput = "I'm looking for a gift for my friend";
      setInput(simulatedVoiceInput);
    }
  };

  const sendMessage = async () => {
    // Prevent sending if input is empty or AI is typing
    if (!input.trim() || isTyping || showDetailedLoading || isAITypingAnimation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      isNew: false
    };

    // Mark all existing messages as not new
    setMessages(prev => [...prev.map(m => ({ ...m, isNew: false })), userMessage]);
    setInput('');

    // Determine delay: 12 seconds if next message has products, otherwise 3.5 seconds
    const nextIndex = messageIndex + 1;
    let aiResponseDelay = 3500; // Default 3.5 seconds
    let hasProducts = false;

    if (currentConversation && nextIndex < currentConversation.messages.length) {
      const nextMessage = currentConversation.messages[nextIndex] as ConversationMessage;
      hasProducts = nextMessage.showProducts || false;
      if (hasProducts) {
        aiResponseDelay = 12000; // 12 seconds for product results
      }
    }

    // Set the appropriate loading message
    const loadingMsg = getLoadingMessage(nextIndex, hasProducts);
    setLoadingMessage(loadingMsg);

    // Show detailed loading screen for product results
    if (hasProducts) {
      // For detailed loading, show it immediately after 1.5 seconds
      setTimeout(() => {
        setShowDetailedLoading(true);
        setIsTyping(false); // Don't show simple overlay
      }, 1500);
    } else {
      // For simple loading, delay showing the loading overlay by 1.5 seconds
      setTimeout(() => {
        setIsTyping(true);
      }, 1500);
    }

    setTimeout(() => {
      if (currentConversation && nextIndex < currentConversation.messages.length) {
        const nextMessage = currentConversation.messages[nextIndex] as ConversationMessage;
        if (nextMessage.role === 'assistant') {
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: nextMessage.content,
            showProducts: nextMessage.showProducts,
            products: nextMessage.products,
            triggerLoading: nextMessage.triggerLoading,
            isNew: nextMessage.content ? true : false, // Don't animate if no content
            showAllProducts: false
          };
          setMessages(prev => [...prev, aiMessage]);
          setMessageIndex(nextIndex + 1);
          // Keep user input disabled while AI message is typing (unless content is empty)
          if (nextMessage.content) {
            setIsAITypingAnimation(true);
          } else {
            setIsAITypingAnimation(false);
          }
        }
      } else {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "That's great! Is there anything else I can help you with today?",
          isNew: true,
          showAllProducts: false
        };
        setMessages(prev => [...prev, aiMessage]);
        // Keep user input disabled while AI message is typing
        setIsAITypingAnimation(true);
      }
      setIsTyping(false);
      setShowDetailedLoading(false);
    }, aiResponseDelay);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent any action if AI is typing
    if (isTyping || showDetailedLoading || isAITypingAnimation) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }

    // Shift+Enter = new line
    if (e.key === 'Enter' && e.shiftKey) {
      return; // Allow default behavior (new line)
    }
    // Enter alone = send message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTypingComplete = (messageId: string) => {
    const completedMessage = messages.find(m => m.id === messageId);
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, isNew: false } : m
    ));
    // Re-enable user input after AI typing animation completes
    setIsAITypingAnimation(false);

    // If this message has triggerLoading flag, show loading screen and then next message
    if (completedMessage?.triggerLoading && currentConversation) {
      const nextIndex = messageIndex;
      if (nextIndex < currentConversation.messages.length) {
        const nextMessage = currentConversation.messages[nextIndex] as ConversationMessage;
        const hasProducts = nextMessage.showProducts || false;

        // Set loading message
        const loadingMsg = getLoadingMessage(nextIndex, hasProducts);
        setLoadingMessage(loadingMsg);

        // Show detailed loading screen
        if (hasProducts) {
          setTimeout(() => {
            setShowDetailedLoading(true);
          }, 500);

          // After 8 seconds, show the next message
          setTimeout(() => {
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: nextMessage.content,
              showProducts: nextMessage.showProducts,
              products: nextMessage.products,
              isNew: true,
              showAllProducts: false
            };
            setMessages(prev => [...prev, aiMessage]);
            setMessageIndex(nextIndex + 1);
            setShowDetailedLoading(false);
            setIsAITypingAnimation(true);
          }, 8000);
        }
      }
    }

  };

  const handleShowMore = (messageId: string) => {
    // Show the next message (Second Premium Option)
    if (currentConversation) {
      const nextIndex = messageIndex;
      if (nextIndex < currentConversation.messages.length) {
        const nextMessage = currentConversation.messages[nextIndex] as ConversationMessage;

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: nextMessage.content,
          showProducts: nextMessage.showProducts,
          products: nextMessage.products,
          triggerLoading: nextMessage.triggerLoading,
          isNew: true,
          showAllProducts: false
        };
        setMessages(prev => [...prev, aiMessage]);
        setMessageIndex(nextIndex + 1);
        setIsAITypingAnimation(true);
      }
    }
  };

  // Detailed loading screen component
  const DetailedLoadingScreen = () => {
    const [currentStep, setCurrentStep] = useState(0);

    // Generate random numbers for this session
    const [randomNumbers] = useState({
      resources: Math.floor(Math.random() * (37 - 19 + 1)) + 19,
      reviews: Math.floor(Math.random() * (9 - 3 + 1)) + 3,
    });

    const steps = [
      { icon: '🔍', text: `Checking ${randomNumbers.resources} resources for grills`, duration: 1200 },
      { icon: '⭐', text: `Checking ${randomNumbers.reviews} resources for customer reviews on grills`, duration: 1200 },
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
        <h2 className="text-xl font-bold text-foreground mb-2 text-center">
          Finding Best Grills
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
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-foreground" />
        </button>
        <div className="flex-1">
          <h3 className="font-medium text-foreground text-xs">Dilly</h3>
          <p className="text-[10px] text-muted-foreground">
            {isTyping || showDetailedLoading ? 'Thinking...' : isAITypingAnimation ? 'Typing...' : 'Ready to help'}
          </p>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="px-2 py-1 rounded-full bg-secondary/50 flex items-center gap-1 hover:bg-secondary transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-foreground" />
            <span className="text-[10px] text-foreground">Start Over</span>
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
                  {(message.showAllProducts ? message.products.slice(0, 2) : message.products.slice(0, 1)).map((product, index) => (
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

                {/* Eye-catching "Show Second Option" button - only show for first product message (empty content) */}
                {message.showProducts && message.content === "" && currentConversation && messageIndex < currentConversation.messages.length && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => handleShowMore(message.id)}
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

      {/* Input - hide when conversation is complete */}
      {!isConversationComplete(messages) && (
        <div className="shrink-0 py-3 bg-background">
          <div className="flex items-center gap-3">
            {/* Input field */}
            <div className="flex-1 relative">
              <input
                ref={textareaRef as any}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={(isTyping || showDetailedLoading || isAITypingAnimation) ? "AI is responding..." : "Ask anything"}
                disabled={isTyping || showDetailedLoading || isAITypingAnimation}
                className="w-full pl-4 pr-4 py-2.5 bg-secondary/30 border-0 rounded-3xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Blue waveform button - switches to voice mode */}
            <button
              onClick={handleSwitchToVoice}
              disabled={isTyping || showDetailedLoading || isAITypingAnimation}
              className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg"
            >
              <AudioWaveform className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
