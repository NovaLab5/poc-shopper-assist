import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, Sparkles } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { ProductCard } from '@/components/ProductCard';
import { mockProducts, type ProductRecommendation } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { upsertCollectionForFriend, upsertFriend } from '@/lib/assistantState';
import { useAssistantState } from '@/hooks/use-assistant-state';
import sourDillmasLogo from '@/assets/sour-dillmas-logo.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: ProductRecommendation[];
  quickReplies?: QuickReply[];
}

type ConversationMode = 'initial' | 'self' | 'gift';

interface GiftInfo {
  friendName?: string;
  age?: string;
  interests?: string;
  style?: string;
  budget?: string;
}

interface QuickReply {
  label: string;
  value: string;
}

interface ResponseAction {
  type: 'saveGiftCollection';
  friendName: string;
  interests?: string;
  budget?: string;
  products: ProductRecommendation[];
}

export default function Chat() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Who are you shopping for?',
      timestamp: new Date(),
      quickReplies: [
        { label: 'Myself', value: 'myself' },
        { label: 'A friend', value: 'friend' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<ConversationMode>('initial');
  const [giftInfo, setGiftInfo] = useState<GiftInfo>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { update } = useAssistantState();

  const suggestedPrompts = useMemo(
    () => [
      'Noise-cancelling headphones for work',
      'Smart display for the kitchen',
      'Portable power bank for travel',
    ],
    []
  );

  useEffect(() => {
    if (searchParams.get('mode') === 'gift' && mode === 'initial') {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === '1'
            ? {
                ...message,
                content: 'Ready to pick a gift? Who are you shopping for?',
                quickReplies: [
                  { label: 'A friend', value: 'friend' },
                  { label: 'Myself', value: 'myself' },
                ],
              }
            : message
        )
      );
    }
  }, [searchParams, mode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const processResponse = (response: {
    message: Message;
    newMode: ConversationMode;
    updatedGiftInfo?: GiftInfo;
    action?: ResponseAction;
  }) => {
    setMessages((prev) => [...prev, response.message]);
    setMode(response.newMode);
    if (response.updatedGiftInfo) {
      setGiftInfo(response.updatedGiftInfo);
    }
    if (response.action?.type === 'saveGiftCollection') {
      update((current) => {
        const interests = response.action?.interests
          ? splitInterests(response.action.interests)
          : [];
        const nextWithFriend = upsertFriend(current, {
          name: response.action.friendName,
          interests,
          budget: response.action.budget,
        });
        return upsertCollectionForFriend(nextWithFriend, {
          friendName: response.action.friendName,
          productIds: response.action.products.map((rec) => rec.product.id),
        });
      });
    }
  };

  const sendUserMessage = (text: string) => {
    if (!text.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAIResponse(text, mode, giftInfo, suggestedPrompts);
      processResponse(response);
      setIsTyping(false);
    }, 800);
  };

  const handleSend = () => {
    sendUserMessage(input);
  };

  const handleQuickReply = (value: string) => {
    sendUserMessage(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="gradient-header px-4 py-4 shrink-0">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-white/40">
              <AvatarImage src={sourDillmasLogo} alt="Sweet Dill" />
              <AvatarFallback>SD</AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/80">
                Sweet Dill
              </p>
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-semibold leading-5">
                  AI Shopping Assistant
                </h1>
                <Sparkles className="w-4 h-4 text-white/90 translate-y-[1px]" />
              </div>
            </div>
          </div>
          <Badge className="rounded-full bg-white/15 text-white border-white/40 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase">
            Live
          </Badge>
        </div>
      </header>

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <MessageBubble
                message={message}
                onQuickReply={handleQuickReply}
                onProductClick={(id) => navigate(`/product/${id}`)}
              />
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2 items-end">
              <Avatar className="h-8 w-8 border border-primary/20">
                <AvatarImage src={sourDillmasLogo} alt="Sweet Dill" />
                <AvatarFallback>SD</AvatarFallback>
              </Avatar>
              <Card className="bg-muted border-none">
                <CardContent className="px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-white">
        <div className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message Sweet Dill..."
            className="flex-1 h-12 rounded-full px-4"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            size="icon"
            className="h-12 w-12 rounded-full"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <BottomNav activeTab="chat" />
    </div>
  );
}

function MessageBubble({
  message,
  onProductClick,
  onQuickReply,
}: {
  message: Message;
  onProductClick: (id: string) => void;
  onQuickReply: (value: string) => void;
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <Card className="bg-primary text-primary-foreground border-none max-w-[75%] rounded-2xl rounded-br-sm">
          <CardContent className="px-4 py-3 text-sm">{message.content}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-end">
      <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
        <AvatarImage src={sourDillmasLogo} alt="Sweet Dill" />
        <AvatarFallback>SD</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <Card className="bg-muted border-none rounded-2xl rounded-bl-sm max-w-[85%]">
          <CardContent className="px-4 py-3 text-sm text-foreground">
            {message.content}
          </CardContent>
        </Card>

        {message.quickReplies && message.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.quickReplies.map((reply) => (
              <Button
                key={reply.value}
                variant="secondary"
                size="sm"
                onClick={() => onQuickReply(reply.value)}
                className="rounded-full"
              >
                {reply.label}
              </Button>
            ))}
          </div>
        )}

        {message.products && message.products.length > 0 && (
          <div className="mt-4 space-y-3">
            {message.products.map((rec) => (
              <div key={rec.product.id}>
                <div className="text-xs text-muted-foreground mb-2 px-2 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'capitalize',
                      rec.tier === 'best' && 'border-amber-500 text-amber-600',
                      rec.tier === 'budget' && 'border-emerald-500 text-emerald-600',
                      rec.tier === 'upgrade' && 'border-indigo-500 text-indigo-600'
                    )}
                  >
                    {rec.tier} choice
                  </Badge>
                  <span>{rec.reason}</span>
                </div>
                <div onClick={() => onProductClick(rec.product.id)}>
                  <ProductCard product={rec.product} tier={rec.tier} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function generateAIResponse(
  userInput: string,
  currentMode: ConversationMode,
  currentGiftInfo: GiftInfo,
  suggestedPrompts: string[]
): {
  message: Message;
  newMode: ConversationMode;
  updatedGiftInfo?: GiftInfo;
  action?: ResponseAction;
} {
  const input = userInput.toLowerCase();

  if (currentMode === 'initial') {
    if (input.includes('gift') || input.includes('friend') || input.includes('someone')) {
      return {
        message: {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Awesome. What's your friend's name?",
          timestamp: new Date(),
        },
        newMode: 'gift',
      };
    }

    if (input.includes('me') || input.includes('myself') || input.includes('self')) {
      return {
        message: {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Great! What are you looking for today?',
          timestamp: new Date(),
          quickReplies: suggestedPrompts.map((prompt) => ({
            label: prompt,
            value: prompt,
          })),
        },
        newMode: 'self',
      };
    }

    return {
      message: {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I can help with personal picks or gifts. Who are you shopping for?',
        timestamp: new Date(),
        quickReplies: [
          { label: 'Myself', value: 'myself' },
          { label: 'A friend', value: 'friend' },
        ],
      },
      newMode: 'initial',
    };
  }

  if (currentMode === 'gift') {
    if (!currentGiftInfo.friendName) {
      return {
        message: {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Nice. Tell me what ${userInput} is into.`,
          timestamp: new Date(),
        },
        newMode: 'gift',
        updatedGiftInfo: { ...currentGiftInfo, friendName: userInput },
      };
    }

    if (!currentGiftInfo.interests) {
      return {
        message: {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Great. What's your price range?",
          timestamp: new Date(),
          quickReplies: [
            { label: '$25-$75', value: '$25-$75' },
            { label: '$75-$150', value: '$75-$150' },
            { label: '$150+', value: '$150+' },
          ],
        },
        newMode: 'gift',
        updatedGiftInfo: { ...currentGiftInfo, interests: userInput },
      };
    }

    if (!currentGiftInfo.budget) {
      const recommendations = getProductRecommendations('gift', {
        ...currentGiftInfo,
        budget: userInput,
      });

      return {
        message: {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Here are gift ideas for ${currentGiftInfo.friendName}. I saved them to their collection.`,
          timestamp: new Date(),
          products: recommendations,
        },
        newMode: 'gift',
        updatedGiftInfo: { ...currentGiftInfo, budget: userInput },
        action: {
          type: 'saveGiftCollection',
          friendName: currentGiftInfo.friendName,
          interests: currentGiftInfo.interests,
          budget: userInput,
          products: recommendations,
        },
      };
    }
  }

  if (currentMode === 'self') {
    return {
      message: {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Here are my top recommendations for you:',
        timestamp: new Date(),
        products: getProductRecommendations('self', {}),
      },
      newMode: 'self',
    };
  }

  return {
    message: {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'I am here to help. Who are you shopping for?',
      timestamp: new Date(),
    },
    newMode: 'initial',
  };
}

function getProductRecommendations(
  mode: 'self' | 'gift',
  info: GiftInfo
): ProductRecommendation[] {
  const interestText = info.interests?.toLowerCase() ?? '';
  const interestMatches = [
    { keys: ['music', 'audio', 'headphone', 'earbud', 'podcast'], category: 'Audio' },
    { keys: ['smart', 'home', 'alexa', 'nest', 'display', 'assistant'], category: 'Smart Home' },
    { keys: ['tech', 'gadget', 'desk', 'mouse', 'travel', 'battery', 'charger'], category: 'Tech Gadgets' },
  ];

  const matchedCategory = interestMatches.find((match) =>
    match.keys.some((key) => interestText.includes(key))
  )?.category;

  const products = matchedCategory
    ? mockProducts.filter((product) => product.category === matchedCategory)
    : mockProducts;

  const picks = [...products];
  if (picks.length < 3) {
    const fallback = mockProducts.filter((product) => !picks.includes(product));
    picks.push(...fallback.slice(0, 3 - picks.length));
  }

  return [
    {
      tier: 'best',
      product: picks[0],
      reason: mode === 'gift' ? 'Most balanced pick for their interests' : 'Best overall value',
    },
    {
      tier: 'budget',
      product: picks[1] ?? picks[0],
      reason: 'Strong value for the price',
    },
    {
      tier: 'upgrade',
      product: picks[2] ?? picks[0],
      reason: 'Premium option with elevated features',
    },
  ];
}

function splitInterests(input: string) {
  return input
    .split(/,|and/gi)
    .map((item) => item.trim())
    .filter(Boolean);
}
