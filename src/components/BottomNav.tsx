import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Heart, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TabType = 'chat' | 'collections' | 'friends' | 'profile';

interface BottomNavProps {
  activeTab?: TabType;
}

export function BottomNav({ activeTab }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
    { id: 'collections', label: 'Collections', icon: Heart, path: '/collections' },
    { id: 'friends', label: 'Friends', icon: Users, path: '/friends' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  const getCurrentTab = (): TabType => {
    if (activeTab) return activeTab;
    const path = location.pathname;
    if (path.startsWith('/chat')) return 'chat';
    if (path.startsWith('/collections')) return 'collections';
    if (path.startsWith('/friends')) return 'friends';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/wishlist')) return 'profile';
    return 'chat';
  };

  const current = getCurrentTab();

  return (
    <nav className="bg-white border-t border-border px-4 py-2 shrink-0">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = current === tab.id;

          return (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 h-auto",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive ? "fill-current" : "")} />
              <span className="text-xs font-medium">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
