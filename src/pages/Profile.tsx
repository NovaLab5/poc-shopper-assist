import { ChevronRight, User, Bell, Heart, Settings, LogOut, Shield, Gift } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAssistantState } from '@/hooks/use-assistant-state';
import sourDillmasLogo from '@/assets/sour-dillmas-logo.png';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { state } = useAssistantState();
  const navigate = useNavigate();

  const userName = 'Guest shopper';
  const userEmail = 'Sign in to sync your profile';

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', onClick: () => {} },
        {
          icon: Bell,
          label: 'Notifications',
          onClick: () => {},
          badge: state.priceAlerts.length ? String(state.priceAlerts.length) : undefined,
        },
        { icon: Heart, label: 'Wishlist', onClick: () => navigate('/wishlist') },
      ],
    },
    {
      title: 'Gifting',
      items: [
        { icon: Gift, label: 'Collections', onClick: () => navigate('/collections') },
        { icon: Heart, label: 'Preferences', onClick: () => {} },
      ],
    },
    {
      title: 'App',
      items: [
        { icon: Settings, label: 'Settings', onClick: () => {} },
        { icon: Shield, label: 'Privacy & Security', onClick: () => {} },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('onboardingComplete');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="gradient-header px-4 py-8 shrink-0">
        <div className="text-center text-white">
          <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white/30 shadow-lg">
            <AvatarImage src={sourDillmasLogo} alt="Profile" />
            <AvatarFallback>SD</AvatarFallback>
          </Avatar>
          <h1 className="text-[20px] font-semibold mb-2">{userName}</h1>
          <p className="text-[13px] text-white/90">{userEmail}</p>
        </div>
      </header>

      <div className="px-4 -mt-6 mb-4">
        <Card className="shadow-card border border-border/60">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[28px] font-bold text-[#1C1C1E] leading-none">
                  {state.wishlist.length}
                </p>
                <p className="text-[13px] text-[#6B7280]">Wishlist</p>
              </div>
              <div>
                <p className="text-[28px] font-bold text-[#1C1C1E] leading-none">
                  {state.collections.length}
                </p>
                <p className="text-[13px] text-[#6B7280]">Collections</p>
              </div>
              <div>
                <p className="text-[28px] font-bold text-[#1C1C1E] leading-none">
                  {state.friends.length}
                </p>
                <p className="text-[13px] text-[#6B7280]">Friends</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wide mb-2 px-2">
              {section.title}
            </h2>
            <Card className="border border-border/60 overflow-hidden">
              <CardContent className="p-0">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.label}
                      variant="ghost"
                      onClick={item.onClick}
                      className={`w-full flex items-center justify-between px-4 py-3 min-h-[44px] rounded-none ${
                        itemIdx < section.items.length - 1 ? 'border-b border-border/60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-[17px] font-normal text-[#1C1C1E]">
                          {item.label}
                        </span>
                        {item.badge && (
                          <Badge className="bg-red-500 text-white text-[13px]">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        ))}

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-[17px] text-destructive border-destructive/30"
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </Button>
      </div>

      <BottomNav activeTab="profile" />
    </div>
  );
}
