import { useState, useRef } from 'react';
import { ArrowLeft, Mic, MicOff, Star, Volume2, Loader2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AILoadingOverlay } from '@/components/AILoadingOverlay';
import sourDillmasLogo from '@/assets/sour-dillmas-logo.png';

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
}

const PRODUCT_DATABASE: Record<string, Product[]> = {
  apple_watch: [
    { id: 'w1', name: 'Apple Watch Series 10 GPS 46mm', price: 429, store: 'Apple', image: 'https://m.media-amazon.com/images/I/81XnJB9ApXL._AC_SL1500_.jpg', rating: 4.9, url: 'https://www.apple.com/shop/buy-watch/apple-watch' },
    { id: 'w2', name: 'Apple Watch Series 10 GPS + Cellular', price: 529, store: 'Best Buy', image: 'https://m.media-amazon.com/images/I/81fxjeu8fdL._AC_SL1500_.jpg', rating: 4.8, url: 'https://www.bestbuy.com/site/searchpage.jsp?st=apple+watch+series+10' },
    { id: 'w3', name: 'Apple Watch SE (2nd Gen) 44mm', price: 249, store: 'Amazon', image: 'https://m.media-amazon.com/images/I/71bf5pRjstL._AC_SL1500_.jpg', rating: 4.7, url: 'https://www.amazon.com/s?k=apple+watch+se+2nd+gen' },
    { id: 'w4', name: 'Apple Watch Series 9 GPS 45mm', price: 349, store: 'Walmart', image: 'https://m.media-amazon.com/images/I/81XnJB9ApXL._AC_SL1500_.jpg', rating: 4.8, url: 'https://www.walmart.com/search?q=apple+watch+series+9' },
  ],
  sunglasses: [
    { id: 's1', name: 'Ray-Ban Wayfarer Classic', price: 169, store: 'Ray-Ban', image: 'https://m.media-amazon.com/images/I/51T9QyoJ4YL._AC_SL1500_.jpg', rating: 4.8, url: 'https://www.ray-ban.com/usa/sunglasses/wayfarer' },
    { id: 's2', name: 'Ray-Ban Aviator Classic', price: 179, store: 'Amazon', image: 'https://m.media-amazon.com/images/I/51T9QyoJ4YL._AC_SL1500_.jpg', rating: 4.7, url: 'https://www.amazon.com/s?k=ray+ban+aviator' },
    { id: 's3', name: 'Ray-Ban Clubmaster Classic', price: 189, store: 'Sunglass Hut', image: 'https://m.media-amazon.com/images/I/71ESUwL8SQL._AC_SL1500_.jpg', rating: 4.6, url: 'https://www.sunglasshut.com/us/ray-ban' },
    { id: 's4', name: 'Ray-Ban Justin Classic', price: 149, store: 'Walmart', image: 'https://m.media-amazon.com/images/I/71G71PjAlRL._AC_SL1500_.jpg', rating: 4.5, url: 'https://www.walmart.com/search?q=ray+ban+justin' },
  ],
  grill: [
    { id: 'g1', name: 'Weber Original Kettle Premium 22"', price: 189, store: 'Amazon', image: 'https://m.media-amazon.com/images/I/71dJ4Y9RnGL._AC_SL1500_.jpg', rating: 4.8, url: 'https://www.amazon.com/s?k=weber+original+kettle+premium+22' },
    { id: 'g2', name: 'Char-Griller E1515 Patio Pro', price: 169, store: 'Home Depot', image: 'https://m.media-amazon.com/images/I/71gL-8mQO+L._AC_SL1500_.jpg', rating: 4.5, url: 'https://www.homedepot.com/s/char-griller+patio+pro' },
    { id: 'g3', name: 'Royal Gourmet CD1824A Charcoal', price: 199, store: 'Walmart', image: 'https://m.media-amazon.com/images/I/71xKTt1XKRL._AC_SL1500_.jpg', rating: 4.6, url: 'https://www.walmart.com/search?q=royal+gourmet+charcoal+grill' },
    { id: 'g4', name: 'Weber Master-Touch Charcoal 22"', price: 359, store: 'Amazon', image: 'https://m.media-amazon.com/images/I/81Ua3MM6SQL._AC_SL1500_.jpg', rating: 4.9, url: 'https://www.amazon.com/s?k=weber+master+touch+charcoal+22' },
  ],
};

export function VoiceInterface({ onBack, userName, onReset }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("SweetDill AI is thinking...");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const userResponses = [
    "Hi! I want to buy a gift for my friend.",
    "Yes, it's James! Remember we bought him a grill?",
    "It's his birthday",
    "I think max 600$, what do you think will be the best gift for him?",
    "Sure, that's a good choice",
  ];
  const [userResponseIndex, setUserResponseIndex] = useState(0);

  const speakText = async (text: string, productsToShow: Product[] | null = null) => {
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

          // If there are products to show, show product search loading
          if (productsToShow && productsToShow.length > 0) {
            setIsSearchingProducts(true);
            setLoadingMessage("SweetDill searching for the best products...");

            // Simulate search delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            setProducts(productsToShow);
            setIsSearchingProducts(false);
          }
        };
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);

      // Show products even if TTS fails
      if (productsToShow && productsToShow.length > 0) {
        setIsSearchingProducts(true);
        setLoadingMessage("SweetDill searching for the best products...");

        // Simulate search delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        setProducts(productsToShow);
        setIsSearchingProducts(false);
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

      const newMessages = userMessage
        ? [...messages, { role: 'user' as const, content: userMessage }, { role: 'assistant' as const, content: data.response }]
        : [...messages, { role: 'assistant' as const, content: data.response }];

      setMessages(newMessages);
      setConversationStarted(true);

      let productsToShow: Product[] | null = null;
      if (data.showProducts) {
        const productList = PRODUCT_DATABASE[data.showProducts.category] || [];
        const filteredProducts = productList.filter(p => p.price <= data.showProducts.budget);
        productsToShow = filteredProducts.length > 0 ? filteredProducts : productList.slice(0, 4);
      }

      await speakText(data.response, productsToShow);
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

  const toggleListening = async () => {
    if (isSpeaking || isProcessing) return;

    if (!isListening) {
      setIsListening(true);
    } else {
      setIsListening(false);
      if (userResponseIndex < userResponses.length) {
        const userMessage = userResponses[userResponseIndex];
        setUserResponseIndex(prev => prev + 1);
        await getAIResponse(userMessage);
      }
    }
  };

  const isDisabled = isSpeaking || isProcessing || isSearchingProducts;

  return (
    <div className="flex flex-col h-full px-4 relative">
      <audio ref={audioRef} />

      {/* AI Loading Overlay - covers the whole interface */}
      <AILoadingOverlay isVisible={isProcessing || isSearchingProducts} message={loadingMessage} />

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

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Products Display */}
        {products.length > 0 ? (
          <div className="w-full">
            <p className="text-xs font-medium text-foreground mb-2 text-center">Here's what I found:</p>
            <div className="grid grid-cols-2 gap-2">
              {products.slice(0, 4).map((product) => (
                <a 
                  key={product.id}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card border border-border/30 rounded-lg p-2 hover:shadow-lg transition-all cursor-pointer hover:border-primary/50 block"
                >
                  <div className="aspect-square rounded-md overflow-hidden mb-1.5 bg-secondary/30">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-[10px] font-medium text-foreground line-clamp-1 mb-0.5">{product.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">${product.price}</span>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] text-muted-foreground">{product.rating}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : !conversationStarted ? (
          /* Initial Start Screen */
          <div className="text-center space-y-4">
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
        ) : (
          <>
            {/* Microphone Button - After conversation started */}
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
          </>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 py-2 text-center">
        <p className="text-[10px] text-muted-foreground">Voice Shopping Assistant</p>
      </div>
    </div>
  );
}
