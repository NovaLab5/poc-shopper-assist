import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Plus, Menu, User, Gift } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import sourDillmasLogo from '@/assets/sour-dillmas-logo.png';

export default function Chat() {
  const [step, setStep] = useState<'initial' | 'conversation'>('initial');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{id: number; text: string; sender: 'user' | 'bot'}>>([]);
  const navigate = useNavigate();

  const handleChoice = (choice: 'myself' | 'friend') => {
    setStep('conversation');
    // Add initial bot message
    setMessages([
      {
        id: 1,
        text: choice === 'myself' 
          ? "Great! Tell me what you're looking for today."
          : "Awesome! Who are you shopping for?",
        sender: 'bot'
      }
    ]);
  };

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F5]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shrink-0 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 
            className="text-[26px] font-bold text-[#4A5568]" 
            style={{ fontFamily: 'Shrikhand, cursive' }}
          >
            Sweet Dill
          </h1>
          <button className="p-2">
            <Menu className="w-6 h-6 text-[#4A5568]" />
          </button>
        </div>
      </header>

      {step === 'initial' ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-40">
          {/* Avatar - smaller and centered to match Figma */}
          <div className="mb-8 flex justify-center">
            <Avatar className="h-16 w-16 border-4 border-white shadow-md">
              <AvatarImage src={sourDillmasLogo} alt="Sweet Dill" />
              <AvatarFallback>SD</AvatarFallback>
            </Avatar>
          </div>

          {/* Heading - single line to match Figma */}
          <h2 className="text-[26px] font-normal text-[#414658] text-center mb-12 leading-tight whitespace-nowrap" 
              style={{ fontFamily: 'Figtree, system-ui, -apple-system, sans-serif' }}>
            Who are you shopping for?
          </h2>

          {/* Buttons - HORIZONTAL layout to match Figma */}
          <div className="flex gap-3 w-full max-w-[380px] px-4">
            <button
              onClick={() => handleChoice('myself')}
              className="flex-1 h-[52px] rounded-full bg-white border-[2px] border-gray-300 
                         flex items-center justify-center gap-2 text-[16px] font-medium 
                         text-[#374151] hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-5 h-5 flex items-center justify-center text-[#4ECDC4]">
                <User className="w-5 h-5" strokeWidth={2} />
              </div>
              Myself
            </button>

            <button
              onClick={() => handleChoice('friend')}
              className="flex-1 h-[52px] rounded-full bg-white border-[2px] border-gray-300 
                         flex items-center justify-center gap-2 text-[16px] font-medium 
                         text-[#374151] hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-5 h-5 flex items-center justify-center text-[#FF6B6B]">
                <Gift className="w-5 h-5" strokeWidth={2} />
              </div>
              Someone else
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <Avatar className="h-8 w-8 shrink-0 mr-2">
                    <AvatarImage src={sourDillmasLogo} alt="Bot" />
                    <AvatarFallback>SD</AvatarFallback>
                  </Avatar>
                )}
                <div 
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.sender === 'user'
                      ? 'bg-[#8BC34A] text-white'
                      : 'bg-white border border-gray-200 text-[#374151]'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 safe-area-bottom">
        <div className="flex items-center gap-3">
          <button className="p-2 text-[#4A5568]">
            <Plus className="w-6 h-6" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={step === 'initial' ? '' : 'Type a message...'}
            className="flex-1 h-10 px-4 rounded-full border border-gray-300 
                     text-base placeholder:text-gray-400 focus:outline-none 
                     focus:border-gray-400"
          />
          
          <button className="p-2 text-[#4A5568]">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <BottomNav activeTab="chat" />
    </div>
  );
}
