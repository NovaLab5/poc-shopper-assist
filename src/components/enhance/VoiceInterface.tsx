import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mic, MicOff, Star, Volume2, Loader2, RotateCcw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AILoadingOverlay } from '@/components/AILoadingOverlay';
import sourDillmasLogo from '@/assets/sour-dillmas-logo.png';
import { getProductsByCategory, transformProductsForComponent } from '@/services/productService';

// Helper to get friendly category name
const getCategoryDisplayName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'apple_watch': 'Apple Watch',
    'sunglasses': 'sunglasses',
    'grill': 'grills',
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
  const [showAllProducts, setShowAllProducts] = useState(false); // Track if showing 2 products
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

            // Show detailed loading for 6-8 seconds
            await new Promise(resolve => setTimeout(resolve, 7000));

            setProducts(productsToShow);
            setShowDetailedProductLoading(false);
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

        // Show detailed loading for 6-8 seconds
        await new Promise(resolve => setTimeout(resolve, 7000));

        setProducts(productsToShow);
        setShowDetailedProductLoading(false);
      }

      toast({ title: "Voice error", description: "Could not play audio. Showing products anyway.", variant: "destructive" });
    }
  };

  const getAIResponse = async (userMessage?: string) => {
    setIsProcessing(true);

    // Set appropriate loading message based on conversation state
    if (!conversationStarted) {
      setLoadingMessage("SweetDill AI is preparing the Voice");
    } else if (userResponseIndex === 0) {
      setLoadingMessage("SweetDill AI is collecting past conversation about friends...");
    } else if (userResponseIndex === 1) {
      setLoadingMessage("SweetDill AI is retrieving James related data...");
    } else if (userResponseIndex === 2) {
      setLoadingMessage("SweetDill AI is thinking...");
    } else if (userResponseIndex === 3) {
      setLoadingMessage("SweetDill AI is checking historical conversations...");
    } else if (userResponseIndex === 4) {
      setLoadingMessage("SweetDill AI is preparing the products...");
    } else {
      setLoadingMessage("SweetDill AI is thinking...");
    }

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
      await speakText(data.response, productsToShow, true, category);
    } catch (error) {
      console.error('AI error:', error);
      toast({ title: "Error", description: "Could not get AI response.", variant: "destructive" });
    } finally {
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

  // Detailed Product Loading Screen Component
  const DetailedProductLoadingScreen = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const categoryName = getCategoryDisplayName(productCategory);

    // Generate random numbers for this session
    const [randomNumbers] = useState({
      resources: Math.floor(Math.random() * (37 - 19 + 1)) + 19,
      reviews: Math.floor(Math.random() * (9 - 3 + 1)) + 3,
    });

    const steps = [
      { icon: '🔍', text: `Checking ${randomNumbers.resources} resources for ${categoryName}`, duration: 1200 },
      { icon: '⭐', text: `Checking ${randomNumbers.reviews} resources for customer reviews on ${categoryName}`, duration: 1200 },
      { icon: '💰', text: 'Finding the best deals', duration: 1200 },
      { icon: '📊', text: 'Evaluating product attributes', duration: 1200 },
      { icon: '💵', text: 'Comparing prices', duration: 1200 },
      { icon: '↩️', text: 'Checking return rates', duration: 1200 },
    ];

    useEffect(() => {
      if (!showDetailedProductLoading) {
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
    }, [showDetailedProductLoading]);

    if (!showDetailedProductLoading) return null;

    const progress = ((currentStep) / steps.length) * 100;

    return (
      <div className="absolute inset-0 bg-background z-50 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-2xl">
              <img src={sourDillmasLogo} alt="Sweet Dill" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground mb-2 text-center">
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
    <div className="flex flex-col h-full px-4 relative">
      <audio ref={audioRef} />

      {/* Detailed Product Loading Screen */}
      {showDetailedProductLoading && <DetailedProductLoadingScreen />}

      {/* AI Loading Overlay - covers the whole interface */}
      <AILoadingOverlay isVisible={isProcessing} message={loadingMessage} />

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

          {/* Products Display */}
          {products.length > 0 && (
            <div className="w-full px-4 pb-4">
              <div className="mb-3 flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                  <Star className="w-3 h-3 fill-primary" />
                  Premium Option
                </span>
              </div>

              {/* Product display - show max 2 products, centered */}
              <div className="flex flex-col items-center gap-4">
                {(showAllProducts ? products.slice(0, 2) : products.slice(0, 1)).map((product) => (
                  <a
                    key={product.id}
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full max-w-[280px] bg-card border-2 border-primary/30 rounded-2xl p-4 hover:shadow-xl transition-all cursor-pointer hover:border-primary hover:scale-[1.02] block group"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-secondary/30 relative">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="eager"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite loop
                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext fill="%236b7280" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EProduct Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                          <span className="text-muted-foreground text-sm">No Image</span>
                        </div>
                      )}
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

              {/* Eye-catching "Show Second Premium Option" button */}
              {products.length > 1 && !showAllProducts && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setShowAllProducts(true)}
                    className="relative px-8 py-4 text-base font-bold text-white rounded-full overflow-hidden group shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 flex items-center gap-2">
                      Second Premium Option
                      <span className="text-xl">✨</span>
                    </span>
                  </button>
                </div>
              )}
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
