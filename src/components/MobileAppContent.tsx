import { useState } from 'react';
import { ChatInterface } from '@/components/enhance/ChatInterface';
import { VoiceInterface } from '@/components/enhance/VoiceInterface';
import { BrowseInterface } from '@/components/enhance/BrowseInterface';
import { LoginScreen } from '@/components/LoginScreen';
import { X, MessageSquare, Mic, List, LogOut } from 'lucide-react';
import sourDillmasLogo from '@/assets/sour-dillmas-logo.png';

type EnhanceMode = 'menu' | 'chat' | 'voice' | 'browse';

// Store chat messages globally to persist between mode switches
interface Product {
  id: string;
  name: string;
  price: number;
  store: string;
  image: string;
  rating: number;
  url?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  showProducts?: boolean;
  products?: Product[];
}

let persistedChatMessages: ChatMessage[] = [];
let persistedConversationIndex = 0;
let persistedMessageIndex = 0;

export function MobileAppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [enhanceMode, setEnhanceMode] = useState<EnhanceMode>('menu');

  // Functions to manage persisted chat state
  const getChatState = () => ({
    messages: persistedChatMessages,
    conversationIndex: persistedConversationIndex,
    messageIndex: persistedMessageIndex,
  });

  const setChatState = (messages: ChatMessage[], convIndex: number, msgIndex: number) => {
    persistedChatMessages = messages;
    persistedConversationIndex = convIndex;
    persistedMessageIndex = msgIndex;
  };

  // Extract name from email
  const getUserName = () => {
    if (!userEmail) return 'User';
    const namePart = userEmail.split('@')[0];
    if (!namePart || namePart.length === 0) return 'User';
    return namePart.charAt(0).toUpperCase() + namePart.substring(1).toLowerCase();
  };
  const userName = getUserName();

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setEnhanceMode('menu');
  };

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderEnhanceMenu = () => (
    <div className="px-4">
      <div className="bg-card rounded-xl p-5 shadow-card border border-border/30 space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full -ml-12 -mb-12" />
        
        <div className="relative z-10">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-3 border-primary/20 shadow-lg">
              <img src={sourDillmasLogo} alt="Sweet Dill" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Hey {userName}! 👋
            </h2>
            <p className="text-sm text-muted-foreground">
              How can I help you find the perfect product?
            </p>
          </div>

          <div className="grid gap-2.5 mt-5">
            <button
              onClick={() => setEnhanceMode('chat')}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 rounded-xl border border-primary/20 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm">Chat with me</h3>
                <p className="text-xs text-muted-foreground">Type your questions</p>
              </div>
            </button>

            <button
              onClick={() => setEnhanceMode('browse')}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 rounded-xl border border-primary/20 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors">
                <List className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm">Browse & Select</h3>
                <p className="text-xs text-muted-foreground">Pick from categories</p>
              </div>
            </button>

            <button
              onClick={() => setEnhanceMode('voice')}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 rounded-xl border border-primary/20 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors">
                <Mic className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm">Talk to me</h3>
                <p className="text-xs text-muted-foreground">Voice conversation</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const handleChatReset = () => {
    persistedChatMessages = [];
    persistedConversationIndex = 0;
    persistedMessageIndex = 0;
    setEnhanceMode('menu');
  };

  const handleVoiceReset = () => {
    setEnhanceMode('menu');
  };

  const renderEnhanceContent = () => {
    switch (enhanceMode) {
      case 'chat':
        return <ChatInterface onBack={() => setEnhanceMode('menu')} getChatState={getChatState} setChatState={setChatState} onReset={handleChatReset} />;
      case 'voice':
        return <VoiceInterface onBack={() => setEnhanceMode('menu')} userName={userName} onReset={handleVoiceReset} />;
      case 'browse':
        return <BrowseInterface onBack={() => setEnhanceMode('menu')} userName={userName} />;
      default:
        return renderEnhanceMenu();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="gradient-header px-4 py-3 pb-8 shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-soft hover:bg-card/90 transition-colors"
          >
            <LogOut className="w-4 h-4 text-foreground" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white/30">
              <img src={sourDillmasLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-sm font-semibold text-white">Sweet Dill</h1>
          </div>
          
          <div
            className="w-8 h-8 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-soft cursor-pointer hover:bg-card/90 transition-colors"
            onClick={() => setEnhanceMode('menu')}
          >
            <X className="w-4 h-4 text-foreground" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 -mt-5 overflow-hidden px-4 pt-4">
        {renderEnhanceContent()}
      </main>
    </div>
  );
}
