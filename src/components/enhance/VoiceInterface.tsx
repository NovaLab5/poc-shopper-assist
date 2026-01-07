import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mic, MicOff, Star, Volume2, Loader2, RotateCcw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AILoadingOverlay } from '@/components/AILoadingOverlay';
import { ProductResultsDisplay, type ProductItem } from '@/components/shared/ProductResultsDisplay';
import { ProductSearchLoadingScreen } from '@/components/shared/ProductSearchLoadingScreen';
import sourDillmasLogo from '@/assets/sour-dillmas-logo.png';
import { getProductsByCategory, transformProductsForComponent } from '@/services/productService';

// Helper to get friendly category name
const getCategoryDisplayName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'apple_watch': 'Apple Watch',
    'sunglasses': 'sunglasses',
    'grills': 'grills',
  };
  return categoryMap[category] || category;
};

interface Product {
  id: string;
  name: string;
  price: number;
  store: string;
  image: string;
  rating: number;
  url: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface VoiceInterfaceProps {
  onBack: () => void;
  userName: string;
  onReset?: () => void;
  autoStart?: boolean;
}

export function VoiceInterface({ onBack, userName, onReset, autoStart = false }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showDetailedProductLoading, setShowDetailedProductLoading] = useState(false);
  const [productCategory, setProductCategory] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [conversationStarted, setConversationStarted] = useState(autoStart);
  const [loadingMessage, setLoadingMessage] = useState("SweetDill AI is thinking...");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const hasAutoStarted = useRef(false);

  // Keep predefined responses for demo mode fallback
  const userResponses = [
    "Hi! I want to buy a gift for my friend.",
    "Yes, it's James! Remember we bought him a grill?",
    "It's his birthday",
    "I think max 600$, what do you think will be the best gift for him?",
    "Sure, that's a good choice",
  ];
  const [userResponseIndex, setUserResponseIndex] = useState(0);

  const speakText = async (text: string, productsToShow: Product[] | null = null, addToTranscript: boolean = true, category: string = '') => {
    setIsSpeaking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) throw new Error('TTS request failed');

      const data = await response.json();
      const audioUrl = `data:audio/mpeg;base64,${data.audio}`;

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = async () => {
          setIsSpeaking(false);

          // Add AI message to transcript AFTER it finishes speaking
          if (addToTranscript) {
            setMessages(prev => [...prev, { role: 'assistant' as const, content: text }]);
          }

          // If there are products to show, show detailed product search loading
          if (productsToShow && productsToShow.length > 0) {
            setProductCategory(category);
            setShowDetailedProductLoading(true);

            // Show detailed loading for 7 seconds
            await new Promise(resolve => setTimeout(resolve, 7000));

            setProducts(productsToShow);
            setShowDetailedProductLoading(false);
            setIsProcessing(false); // Turn off processing after products are shown
          }
        };
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);

      // Add AI message to transcript even if TTS fails
      if (addToTranscript) {
        setMessages(prev => [...prev, { role: 'assistant' as const, content: text }]);
      }

      // Show products even if TTS fails
      if (productsToShow && productsToShow.length > 0) {
        setProductCategory(category);
        setShowDetailedProductLoading(true);

        // Show detailed loading for 7 seconds
        await new Promise(resolve => setTimeout(resolve, 7000));

        setProducts(productsToShow);
        setShowDetailedProductLoading(false);
        setIsProcessing(false); // Turn off processing after products are shown
      }

      toast({ title: "Voice error", description: "Could not play audio. Showing products anyway.", variant: "destructive" });
    }
  };

  const getAIResponse = async (userMessage?: string) => {
    setIsProcessing(true);

    // Set contextual loading message based on conversation content
    const getContextualLoadingMessage = () => {
      if (!conversationStarted) {
        return "Starting voice assistant...";
      }

      const lowerMessage = userMessage?.toLowerCase() || '';

      // Check for gift-related keywords
      if (lowerMessage.includes('gift') || lowerMessage.includes('present')) {
        return "Understanding your gift needs...";
      }

      // Check for friend/person mentions
      if (lowerMessage.includes('friend') || lowerMessage.includes('mother') ||
          lowerMessage.includes('father') || lowerMessage.includes('brother') ||
          lowerMessage.includes('sister') || lowerMessage.includes('wife') ||
          lowerMessage.includes('husband')) {
        return "Analyzing recipient preferences...";
      }

      // Check for occasion mentions
      if (lowerMessage.includes('birthday') || lowerMessage.includes('anniversary') ||
          lowerMessage.includes('christmas') || lowerMessage.includes('wedding')) {
        return "Considering the special occasion...";
      }

      // Check for budget/price mentions
      if (lowerMessage.includes('$') || lowerMessage.includes('budget') ||
          lowerMessage.includes('price') || /\d+/.test(lowerMessage)) {
        return "Finding options within your budget...";
      }

      // Check for product categories
      if (lowerMessage.includes('watch') || lowerMessage.includes('grill') ||
          lowerMessage.includes('sunglasses') || lowerMessage.includes('laptop') ||
          lowerMessage.includes('phone') || lowerMessage.includes('headphones')) {
        return "Searching for the perfect product...";
      }

      // Check if we have products (likely final stage)
      if (products.length > 0) {
        return "Preparing your recommendations...";
      }

      // Check conversation length to determine stage
      if (messages.length === 0) {
        return "Getting ready to help you...";
      } else if (messages.length < 3) {
        return "Understanding your request...";
      } else if (messages.length < 5) {
        return "Gathering more details...";
      } else {
        return "Finding the best options for you...";
      }
    };

    setLoadingMessage(getContextualLoadingMessage());

    try {
      // Use current messages state for API call
      const chatMessages = userMessage
        ? [...messages, { role: 'user' as const, content: userMessage }]
        : messages;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/voice-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: chatMessages,
            isFirstMessage: !conversationStarted,
            userName: userName,
            userId: 'user-' + userName.toLowerCase().replace(/\s+/g, '-')
          }),
        }
      );

      if (!response.ok) throw new Error('AI request failed');

      const data = await response.json();

      // Add user message to transcript AFTER AI processes it (before AI speaks)
      if (userMessage) {
        setMessages(prev => [...prev, { role: 'user' as const, content: userMessage }]);
      }

      setConversationStarted(true);

      let productsToShow: Product[] | null = null;
      let category = '';
      if (data.showProducts) {
        category = data.showProducts.category;
        try {
          // Load products from API
          const apiProducts = await getProductsByCategory(category, data.showProducts.budget);
          const transformedProducts = transformProductsForComponent(apiProducts);
          productsToShow = transformedProducts.length > 0 ? transformedProducts : [];
        } catch (error) {
          console.error('Error loading products:', error);
          productsToShow = [];
        }
      }

      // Speak the AI response (will add to transcript after speaking)
      // Don't set isProcessing to false yet if we're about to show products
      if (!productsToShow || productsToShow.length === 0) {
        setIsProcessing(false);
      }
      await speakText(data.response, productsToShow, true, category);
    } catch (error) {
      console.error('AI error:', error);
      toast({ title: "Error", description: "Could not get AI response.", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  const startConversation = async () => {
    if (isSpeaking || isProcessing) return;
    await getAIResponse();
  };

  // Auto-start conversation if autoStart prop is true (from chat mode)
  useEffect(() => {
    if (autoStart && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      // When coming from chat, just greet and wait for user input
      const greetingMessage = `Hey ${userName}! I'm ready to help you find what you're looking for. What can I help you with today?`;
      setConversationStarted(true);
      // Speak greeting (will add to transcript after speaking)
      speakText(greetingMessage, null, true);
    }
  }, [autoStart]);

  // Auto-scroll transcript to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      console.log('Transcript updated:', messages);
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const toggleListening = async () => {
    if (isSpeaking || isProcessing) return;

    if (!isListening) {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());

          // Convert audio to base64 and send to STT
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          const reader = new FileReader();

          reader.onloadend = async () => {
            const base64Audio = reader.result as string;

            try {
              setIsProcessing(true);
              setLoadingMessage("Dilly is thinking...");

              const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/stt`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ audio: base64Audio }),
                }
              );

              if (!response.ok) throw new Error('STT request failed');

              const data = await response.json();
              const userMessage = data.transcript;

              if (userMessage && userMessage.trim()) {
                console.log('User said:', userMessage);
                await getAIResponse(userMessage);
              } else {
                toast({
                  title: "No speech detected",
                  description: "Please try again and speak clearly.",
                  variant: "destructive"
                });
                setIsProcessing(false);
              }
            } catch (error) {
              console.error('STT error:', error);
              toast({
                title: "Speech recognition failed",
                description: "Could not convert speech to text. Please try again.",
                variant: "destructive"
              });
              setIsProcessing(false);
            }
          };

          reader.readAsDataURL(audioBlob);
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsListening(true);
      } catch (error) {
        console.error('Microphone access error:', error);
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use voice features.",
          variant: "destructive"
        });
      }
    } else {
      // Stop recording
      setIsListening(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const isDisabled = isSpeaking || isProcessing || isSearchingProducts;



  return (
    <div className="flex flex-col h-full px-4 relative">
      <audio ref={audioRef} />

      {/* Detailed Product Loading Screen */}
      {showDetailedProductLoading && (
        <div className="absolute inset-0 bg-background z-50">
          <ProductSearchLoadingScreen
            category={getCategoryDisplayName(productCategory)}
            duration={7000}
          />
        </div>
      )}

      {/* AI Loading Overlay - covers the whole interface (but not when showing product loading) */}
      <AILoadingOverlay isVisible={isProcessing && !showDetailedProductLoading} message={loadingMessage} />

      <div className="flex items-center gap-3 p-3 bg-card rounded-xl shadow-card border border-border/30 mb-3 shrink-0">
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-foreground" />
        </button>
        <div className="flex-1">
          <h3 className="font-medium text-foreground text-xs">Voice Assistant</h3>
          <p className="text-[10px] text-muted-foreground">
            {isProcessing ? 'Thinking...' : isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Ready to help'}
          </p>
        </div>
        {isSpeaking && <Volume2 className="w-4 h-4 text-primary animate-pulse" />}
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

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col min-h-full">
          {/* Conversation Transcript - Show when there are messages */}
          {messages.length > 0 && (
            <div className="px-4 py-3">
              <div className="space-y-2">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                        message.role === 'user'
                          ? 'bg-primary/20 text-foreground/80'
                          : 'bg-secondary/40 text-foreground/70'
                      }`}
                    >
                      <p className="text-[10px] font-medium mb-0.5 opacity-60">
                        {message.role === 'user' ? 'You' : 'Dilly'}
                      </p>
                      <p className="leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          )}

          {/* Products Display - Using Unified Component */}
          {products.length > 0 && (
            <div className="w-full px-4 pb-4">
              <ProductResultsDisplay
                products={products as ProductItem[]}
                maxBudget={null}
                onSomethingElse={async () => {
                  // Clear products and ask for new category/budget
                  setProducts([]);
                  setProductCategory('');

                  // Add a message asking for new preferences
                  const askAgainMessage = "No problem! What other category or budget would you like to explore?";
                  setMessages(prev => [...prev, { role: 'assistant' as const, content: askAgainMessage }]);

                  // Speak the message
                  try {
                    await speakText(askAgainMessage, null, false);
                  } catch (error) {
                    console.error('Error speaking:', error);
                  }
                }}
              />
            </div>
          )}

          {/* Initial Start Screen */}
          {!conversationStarted && products.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 px-4">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-4 border-primary/30 shadow-lg">
                  <img src={sourDillmasLogo} alt="Sweet Dill" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">Let's find something special!</h2>
                  <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                    Tap below to start talking and I'll help you find the perfect item.
                  </p>
                </div>
                <button
                  onClick={startConversation}
                  disabled={isDisabled}
                  className={`px-6 py-3 rounded-full font-medium transition-all ${
                    isDisabled
                      ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-lg'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting...
                    </span>
                  ) : (
                    "Let's Find a Deal"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Microphone Button and Status - Show when conversation started but NO products */}
          {conversationStarted && products.length === 0 && (
            <div className={`px-4 ${messages.length === 0 ? 'flex-1 flex items-center justify-center' : 'flex-shrink-0 pb-8'}`}>
              <div className="flex flex-col items-center justify-center">
              {/* Microphone Button */}
              <div className="relative mb-4">
                {isListening && !isDisabled && (
                  <>
                    <div className="absolute inset-0 w-28 h-28 -m-4 rounded-full bg-primary/20 animate-ping" />
                    <div className="absolute inset-0 w-24 h-24 -m-2 rounded-full bg-primary/30 animate-pulse" />
                  </>
                )}
                {isSpeaking && (
                  <div className="absolute inset-0 w-28 h-28 -m-4 rounded-full bg-accent/20 animate-pulse" />
                )}

                <button
                  onClick={toggleListening}
                  disabled={isDisabled}
                  className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isDisabled
                      ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                      : isListening
                        ? 'bg-destructive text-destructive-foreground scale-110 shadow-lg'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : isSpeaking ? (
                    <Volume2 className="w-8 h-8" />
                  ) : isListening ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>
              </div>

              {/* Status Text */}
              <div className="text-center">
                {isDisabled ? (
                  <p className="text-xs text-muted-foreground">
                    {isProcessing ? 'Processing...' : 'Wait for me to finish'}
                  </p>
                ) : isListening ? (
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">I'm listening...</p>
                    <p className="text-[10px] text-muted-foreground">Tap again when done</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">Tap to respond</p>
                    <p className="text-[10px] text-muted-foreground">Continue conversation</p>
                  </div>
                )}
              </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 py-2 text-center">
        <p className="text-[10px] text-muted-foreground">Voice Shopping Assistant</p>
      </div>
    </div>
  );
}
