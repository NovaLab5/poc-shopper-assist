import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Plus, Menu, User, Gift } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import sourDillmasLogo from '@/assets/sour-dillmas-logo.png';

export default function Chat() {
  const [step, setStep] = useState<'initial' | 'conversation'>('initial');
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const handleChoice = (choice: 'myself' | 'friend') => {
    setStep('conversation');
    // Will navigate to conversation flow
  };

  return (
    <div className="h-screen flex flex-col bg-[#F5F5F5]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shrink-0 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 
            className="text-[26px] font-bold text-[#4A5568] italic" 
            style={{ fontFamily: 'Georgia, serif' }}
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
          {/* Avatar */}
          <div className="mb-10">
            <Avatar className="h-28 w-28 border-4 border-white shadow-md">
              <AvatarImage src={sourDillmasLogo} alt="Sweet Dill" />
              <AvatarFallback>SD</AvatarFallback>
            </Avatar>
          </div>

          {/* Heading */}
          <h2 className="text-[32px] font-normal text-[#414658] text-center mb-16 leading-tight" 
              style={{ fontFamily: 'Figtree, system-ui, -apple-system, sans-serif' }}>
            Who are you<br />shopping for?
          </h2>

          {/* Buttons */}
          <div className="w-full max-w-[340px] space-y-4">
            <button
              onClick={() => handleChoice('myself')}
              className="w-full h-[56px] rounded-full bg-white border-[2px] border-gray-300 
                         flex items-center justify-center gap-3 text-[17px] font-medium 
                         text-[#374151] hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-5 h-5 flex items-center justify-center text-[#4ECDC4]">
                <User className="w-5 h-5" strokeWidth={2} />
              </div>
              Myself
            </button>

            <button
              onClick={() => handleChoice('friend')}
              className="w-full h-[56px] rounded-full bg-white border-[2px] border-gray-300 
                         flex items-center justify-center gap-3 text-[17px] font-medium 
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
        <div className="flex-1">
          {/* Conversation view - to be built */}
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
            disabled={step === 'initial'}
            placeholder=""
            className="flex-1 h-10 px-4 rounded-full border border-gray-300 
                     text-base placeholder:text-gray-400 focus:outline-none 
                     focus:border-gray-400 disabled:bg-gray-50"
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
