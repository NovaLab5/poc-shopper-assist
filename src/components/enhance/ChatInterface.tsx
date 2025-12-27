import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Star, RotateCcw, Check } from 'lucide-react';
import { AILoadingOverlay } from '@/components/AILoadingOverlay';
import { TypingMessage } from '@/components/enhance/TypingMessage';
import conversationsData from '@/data/chatConversations.json';
import sourDillLogo from '@/assets/sour-dillmas-logo.png';

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
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  showProducts?: boolean;
  products?: Product[];
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
}

// Check if conversation is complete (has shown products)
const isConversationComplete = (messages: Message[]) => {
  return messages.some(m => m.showProducts && m.products);
};

export function ChatInterface({ onBack, getChatState, setChatState, onReset }: ChatInterfaceProps) {
  const savedState = getChatState();
  const [messages, setMessages] = useState<Message[]>(savedState.messages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAITypingAnimation, setIsAITypingAnimation] = useState(false);
  const [conversationIndex] = useState(savedState.conversationIndex);
  const [messageIndex, setMessageIndex] = useState(savedState.messageIndex);
  const [loadingMessage, setLoadingMessage] = useState("SweetDill AI is Preparing the conversation...");
  const [showDetailedLoading, setShowDetailedLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(savedState.messages.length === 0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentConversation = conversationsData.conversations[conversationIndex];

  // Get loading message based on message index
  const getLoadingMessage = (msgIndex: number, hasProducts: boolean): string => {
    if (hasProducts) {
      // Don't show simple loading message for products - we'll show detailed loading
      return "";
    }

    // msgIndex represents the NEXT message that will be shown
    switch (msgIndex) {
      case 2: // After user's first message (showing AI response about friend details)
        return "SweetDill AI is on live search mode...";
      case 4: // After user describes James (showing AI response about grill suggestion)
        return "SweetDill AI is finding best categories for Housewarming gifts..";
      case 6: // After user gives budget (showing products) - but this has products so won't be used
        return "SweetDill AI is Finding the best products for you...";
      default:
        return "SweetDill AI is on live search mode...";
    }
  };

  // Save state when messages change
  useEffect(() => {
    setChatState(messages, conversationIndex, messageIndex);
  }, [messages, conversationIndex, messageIndex, setChatState]);

  // Initialize with first message if no saved messages
  useEffect(() => {
    if (messages.length === 0 && currentConversation && currentConversation.messages.length > 0) {
      // Show initial loading screen for 2 seconds
      setIsTyping(true);
      setLoadingMessage("SweetDill AI is Preparing the conversation...");

      setTimeout(() => {
        const firstMessage = currentConversation.messages[0] as ConversationMessage;
        setMessages([{
          id: '1',
          role: firstMessage.role,
          content: firstMessage.content,
          showProducts: firstMessage.showProducts,
          products: firstMessage.products,
          isNew: true
        }]);
        setMessageIndex(1);
        setIsTyping(false);
        setIsInitializing(false);
        // Keep input disabled while initial message is typing
        setIsAITypingAnimation(true);
      }, 2000);
    }
  }, [currentConversation, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when messages change or while typing
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll during typing animation - poll every 100ms while typing
  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(scrollToBottom, 100);
      return () => clearInterval(interval);
    }
  }, [isTyping]);

  // Auto-scroll when any message is being animated (isNew)
  useEffect(() => {
    const hasAnimatingMessage = messages.some(m => m.isNew);
    if (hasAnimatingMessage) {
      const interval = setInterval(scrollToBottom, 50);
      return () => clearInterval(interval);
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 80) + 'px';
    }
  }, [input]);

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

    // Determine delay: 8 seconds if next message has products, otherwise 3.5 seconds
    const nextIndex = messageIndex + 1;
    let aiResponseDelay = 3500; // Default 3.5 seconds
    let hasProducts = false;

    if (currentConversation && nextIndex < currentConversation.messages.length) {
      const nextMessage = currentConversation.messages[nextIndex] as ConversationMessage;
      hasProducts = nextMessage.showProducts || false;
      if (hasProducts) {
        aiResponseDelay = 8000; // 8 seconds for product results
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
            isNew: true,
            showAllProducts: false
          };
          setMessages(prev => [...prev, aiMessage]);
          setMessageIndex(nextIndex + 1);
          // Keep user input disabled while AI message is typing
          setIsAITypingAnimation(true);
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
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, isNew: false } : m
    ));
    // Re-enable user input after AI typing animation completes
    setIsAITypingAnimation(false);
  };

  const handleLoadMore = (messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, showAllProducts: true } : m
    ));
  };

  // Detailed loading screen component
  const DetailedLoadingScreen = () => {
    const initialSteps = [
      { text: "Checking 2000+ products", completed: false },
      { text: "Evaluating product attributes", completed: false },
      { text: "Choosing 400+ customer reviews", completed: false },
      { text: "Comparing prices", completed: false },
      { text: "Checking return rates", completed: false },
    ];

    const [steps, setSteps] = useState(initialSteps);

    useEffect(() => {
      if (!showDetailedLoading) {
        // Reset steps when not showing
        setSteps(initialSteps);
        return;
      }

      const stepDuration = 1300; // Each step takes 1.3 seconds (6.5 seconds / 5 steps)
      const timers: NodeJS.Timeout[] = [];

      initialSteps.forEach((_, index) => {
        const timer = setTimeout(() => {
          setSteps(prev =>
            prev.map((step, i) =>
              i === index ? { ...step, completed: true } : step
            )
          );
        }, stepDuration * (index + 1));
        timers.push(timer);
      });

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showDetailedLoading]);

    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md animate-fade-in rounded-xl">
        <div className="flex flex-col items-center gap-6 px-6 py-8 max-w-sm w-full">
          {/* Logo */}
          <div className="relative">
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/20 animate-ping" />
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/30 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center animate-bounce border-2 border-primary/30" style={{ animationDuration: '1.5s' }}>
              <img src={sourDillLogo} alt="Sweet Dill" className="w-14 h-14 object-contain" />
            </div>
          </div>

          {/* Message */}
          <p className="text-sm font-semibold text-foreground text-center">
            SweetDill AI is Finding the best products for you...
          </p>

          {/* Checklist */}
          <div className="w-full space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-center justify-start gap-2.5 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                    ${step.completed
                      ? 'bg-primary text-primary-foreground'
                      : 'border-2 border-muted-foreground/30'
                    }
                  `}
                >
                  {step.completed && <Check className="w-4 h-4" />}
                </div>
                <p
                  className={`
                    text-sm transition-colors duration-300
                    ${step.completed
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                    }
                  `}
                >
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-linear"
              style={{
                width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full px-4 relative">
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
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">D</span>
          </div>
          <div>
            <h3 className="font-medium text-foreground text-sm">Dilly</h3>
            <p className="text-[10px] text-primary">Online</p>
          </div>
        </div>
        {onReset && isConversationComplete(messages) ? (
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground flex items-center gap-1.5 hover:bg-primary/90 transition-colors shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Start Over</span>
          </button>
        ) : onReset && (
          <button
            onClick={onReset}
            className="px-2 py-1 rounded-full bg-secondary/50 flex items-center gap-1 hover:bg-secondary transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-foreground" />
            <span className="text-[10px] text-foreground">Start Over</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-2">
        {messages.map((message) => (
          <div key={message.id}>
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
            
            {/* Product Cards */}
            {message.showProducts && message.products && (
              <>
                {/* Intro message - centered with better visibility */}
                <div className="mt-4 mb-3 text-center px-4 py-2 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg">
                  <p className="text-base font-bold text-primary drop-shadow-sm">
                    Here are some items I found for you!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(message.showAllProducts ? message.products : message.products.slice(0, 4)).map((product) => (
                    <a
                      key={product.id}
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-card border-2 border-primary/30 rounded-xl p-2.5 hover:shadow-lg transition-all cursor-pointer hover:border-primary hover:scale-[1.02] block group"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-secondary/30 relative">
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
                      <h4 className="text-xs font-medium text-foreground line-clamp-2 mb-1">
                        {product.name}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">${product.price}</span>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-[10px] text-muted-foreground">{product.rating}</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{product.store}</p>
                    </a>
                  ))}
                </div>

                {/* Load More button */}
                {message.products.length > 4 && !message.showAllProducts && (
                  <button
                    onClick={() => handleLoadMore(message.id)}
                    className="w-full mt-3 py-2.5 text-xs font-medium text-primary hover:text-primary-foreground hover:bg-primary transition-all flex items-center justify-center gap-1 border-2 border-primary rounded-xl">
                    Load More ({message.products.length - 4} more items)
                  </button>
                )}
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - hide when conversation is complete */}
      {!isConversationComplete(messages) && (
        <div className="shrink-0 py-2 bg-background">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={(isTyping || showDetailedLoading || isAITypingAnimation) ? "AI is responding..." : "Type a message... (Shift+Enter for new line)"}
              rows={1}
              disabled={isTyping || showDetailedLoading || isAITypingAnimation}
              className="flex-1 px-4 py-2.5 bg-secondary/50 border border-border/30 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none min-h-[40px] max-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping || showDetailedLoading || isAITypingAnimation}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
