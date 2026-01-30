import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Gift, TrendingDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import sourDillmasLogo from '@/assets/sour-dillmas-logo.png';

const onboardingSteps = [
  {
    title: 'Welcome to Sweet Dill',
    subtitle: 'Your AI shopping assistant',
    description:
      'Chat naturally, get smart recommendations, and track prices without ads or noise.',
    icon: Sparkles,
    features: [
      {
        icon: MessageSquare,
        title: 'Chat with AI',
        description: 'Tell us who you are shopping for and what they love',
      },
      {
        icon: Gift,
        title: 'Gift Collections',
        description: 'Every friend gets a personalized collection of ideas',
      },
      {
        icon: TrendingDown,
        title: 'Price Tracking',
        description: 'Set alerts and learn when to buy at the best price',
      },
    ],
  },
  {
    title: 'How It Works',
    subtitle: 'Three simple steps',
    steps: [
      {
        number: '1',
        title: 'Start a chat',
        description: 'Choose myself or a friend and share a few details.',
      },
      {
        number: '2',
        title: 'Compare picks',
        description: 'Get best, budget, and upgrade options with reasons.',
      },
      {
        number: '3',
        title: 'Track and save',
        description: 'Save favorites, build collections, and set price alerts.',
      },
    ],
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('onboardingComplete', 'true');
      navigate('/chat');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingComplete', 'true');
    navigate('/chat');
  };

  const step = onboardingSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary/20 flex flex-col">
      <div className="p-4 flex justify-end">
        <Button variant="ghost" onClick={handleSkip} className="text-sm">
          Skip
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <PhoneMockup>
          <div className="h-full flex flex-col p-6">
            <div className="flex justify-center mb-6">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarImage src={sourDillmasLogo} alt="Sweet Dill" />
                <AvatarFallback>SD</AvatarFallback>
              </Avatar>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-[22px] font-semibold text-foreground mb-2">
                {step.title}
              </h1>
              <p className="text-[15px] text-primary font-medium">{step.subtitle}</p>
            </div>

            {currentStep === 0 && (
              <div className="flex-1 space-y-6">
                <p className="text-sm text-muted-foreground text-center leading-6">
                  {step.description}
                </p>

                <div className="space-y-4">
                  {step.features?.map((feature, idx) => (
                    <Card key={idx} className="border border-border/60 shadow-sm">
                      <CardContent className="p-5 flex items-start gap-4">
                        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <feature.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-semibold text-foreground mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-[13px] leading-5 text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="flex-1 space-y-6">
                {step.steps?.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-lg">
                      <span className="text-white font-bold text-lg">{item.number}</span>
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PhoneMockup>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex justify-center gap-2">
          {onboardingSteps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 rounded-full py-6"
        >
          {currentStep < onboardingSteps.length - 1 ? 'Next' : "Let's Start"}
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

function PhoneMockup({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full max-w-[390px] aspect-[9/19.5] bg-foreground rounded-[3rem] p-3 shadow-2xl">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-foreground rounded-b-3xl z-10" />
      <div className="relative h-full bg-white rounded-[2.5rem] overflow-hidden">{children}</div>
    </div>
  );
}
