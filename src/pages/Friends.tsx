import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Gift, ChevronRight } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAssistantState } from '@/hooks/use-assistant-state';

export default function Friends() {
  const navigate = useNavigate();
  const { state } = useAssistantState();

  const friends = useMemo(() => {
    return [...state.friends].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [state.friends]);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="gradient-header px-4 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-[17px] font-semibold text-white">Friends</h1>
          <Button
            size="icon"
            variant="ghost"
            className="h-11 w-11 text-white hover:text-white hover:bg-white/20"
            onClick={() => navigate('/chat?mode=gift')}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-[13px] text-white/90 mt-2">People you shop for</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <Users className="w-24 h-24 text-[#9CA3AF] mb-6" />
            <h2 className="text-[20px] font-semibold text-[#1C1C1E] mb-2">
              No friends added yet
            </h2>
            <p className="text-[15px] leading-[20px] text-[#6B7280] mb-6 max-w-sm">
              Start a gift chat and Sweet Dill will create a friend profile for you.
            </p>
            <Button
              onClick={() => navigate('/chat?mode=gift')}
              className="rounded-full px-6 py-3 min-h-[44px] text-[17px] font-normal"
            >
              Start a gift chat
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {friends.map((friend) => (
              <Card
                key={friend.id}
                className="border border-border/60 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate('/collections')}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-14 w-14 bg-primary/10 text-primary font-semibold">
                    <AvatarFallback>{getInitials(friend.name)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-[17px] font-semibold text-[#1C1C1E]">
                        {friend.name}
                      </h3>
                      {friend.budget && (
                        <Badge variant="secondary" className="rounded-full text-[13px]">
                          {friend.budget}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {friend.interests.length > 0 ? (
                        friend.interests.map((interest) => (
                          <Badge
                            key={interest}
                            variant="outline"
                            className="rounded-full text-[13px]"
                          >
                            {interest}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-[13px] text-[#6B7280]">
                          Interests not set yet
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-[#6B7280]">
                      <Gift className="w-3 h-3" />
                      <span>Updated {new Date(friend.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav activeTab="friends" />
    </div>
  );
}
