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
          <h1 className="text-xl font-bold text-white">Friends</h1>
          <Button
            size="icon"
            variant="ghost"
            className="text-white hover:text-white hover:bg-white/20"
            onClick={() => navigate('/chat?mode=gift')}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-sm text-white/90 mt-1">People you shop for</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Users className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No friends added yet
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Start a gift chat and Sweet Dill will create a friend profile for you.
            </p>
            <Button onClick={() => navigate('/chat?mode=gift')} className="rounded-full">
              Start a gift chat
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
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
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{friend.name}</h3>
                      {friend.budget && (
                        <Badge variant="secondary" className="rounded-full">
                          {friend.budget}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {friend.interests.length > 0 ? (
                        friend.interests.map((interest) => (
                          <Badge
                            key={interest}
                            variant="outline"
                            className="rounded-full text-xs"
                          >
                            {interest}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Interests not set yet
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Gift className="w-3 h-3" />
                      <span>Updated {new Date(friend.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
