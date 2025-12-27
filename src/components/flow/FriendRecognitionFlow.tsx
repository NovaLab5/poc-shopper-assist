import { useState } from 'react';
import { User, UserPlus, Check } from 'lucide-react';
import chatData from '@/data/chatConversations.json';

interface KnownFriend {
  id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
  purchaseHistory: { item: string; occasion: string }[];
}

interface FriendRecognitionFlowProps {
  onSelectKnownFriend: (friend: KnownFriend) => void;
  onSelectNewFriend: () => void;
  onYesClick?: () => void;
  initialStep?: Step;
}

type Step = 'ask_know' | 'select_friend';

interface ChatData {
  conversations: unknown[];
  knownFriends: KnownFriend[];
}

export function FriendRecognitionFlow({
  onSelectKnownFriend,
  onSelectNewFriend,
  onYesClick,
  initialStep = 'ask_know'
}: FriendRecognitionFlowProps) {
  const [step, setStep] = useState<Step>(initialStep);
  const knownFriends = (chatData as ChatData).knownFriends;

  if (step === 'ask_know') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-semibold text-foreground">
            Do I know your friend?
          </h2>
          <p className="text-xs text-muted-foreground">
            I might remember them from before!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              if (onYesClick) {
                onYesClick();
              } else {
                setStep('select_friend');
              }
            }}
            className="group flex flex-col items-center justify-center p-4 rounded-xl border border-sour-green/30 bg-sour-green/5 hover:bg-sour-green hover:text-white hover:border-sour-green transition-all duration-200"
          >
            <Check className="w-6 h-6 mb-1" />
            <span className="font-semibold text-sm">Yes</span>
            <span className="text-[10px] opacity-70">We already talked about in the past</span>
          </button>

          <button
            onClick={onSelectNewFriend}
            className="group flex flex-col items-center justify-center p-4 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
          >
            <UserPlus className="w-6 h-6 mb-1" />
            <span className="font-semibold text-sm">No</span>
            <span className="text-[10px] opacity-70">You do not know</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'select_friend') {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            Which friend?
          </h2>
          <p className="text-xs text-muted-foreground">
            Select one of your friends
          </p>
        </div>

        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {knownFriends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => onSelectKnownFriend(friend)}
              className="w-full group flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-sour-green hover:text-white hover:border-sour-green transition-all duration-200 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-sour-green/20 group-hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
                <User className="w-5 h-5 text-sour-green group-hover:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{friend.name}</h3>
                <p className="text-xs opacity-70 truncate">
                  {friend.age}y • {friend.interests.slice(0, 2).join(', ')}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
