import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Gift, TrendingDown, MessageSquare, Sparkles } from 'lucide-react';
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
    <div className="h-screen bg-gradient-to-br from-primary/10 via-white to-primary/20 flex flex-col">
      <div className="p-4 flex justify-end">
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="text-sm text-[#6B7280] hover:text-[#1F2937]"
        >
          Skip
        </Button>
      </div>

      <div className="flex-1 flex flex-col px-6 pb-10 overflow-hidden">
        <div className="h-full flex flex-col p-6 relative">
          <div className="flex justify-center mb-6">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarImage src={sourDillmasLogo} alt="Sweet Dill" />
              <AvatarFallback>SD</AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-[28px] font-bold text-[#1F2937] mb-2 leading-[34px] tracking-tight">
              {step.title}
            </h1>
            <p className="text-[17px] text-primary font-medium leading-[22px]">
              {step.subtitle}
            </p>
          </div>

          <div className="flex-1 overflow-auto pb-32">
            {currentStep === 0 && (
              <div className="space-y-4">
                <p className="text-[15px] text-[#6B7280] text-center leading-[22px] mb-6">
                  {step.description}
                </p>

                <div className="space-y-3">
                  {step.features?.map((feature, idx) => (
                    <Card key={idx} className="border-0 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
                      <CardContent className="p-5 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                          <feature.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-[17px] font-semibold text-[#1F2937] mb-1 leading-[22px]">
                            {feature.title}
                          </h3>
                          <p className="text-[15px] leading-[20px] text-[#6B7280]">
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
              <div className="space-y-6">
                {step.steps?.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-md">
                      <span className="text-white font-bold text-[20px]">{item.number}</span>
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-[17px] font-semibold text-[#1F2937] mb-1 leading-[22px]">
                        {item.title}
                      </h3>
                      <p className="text-[15px] text-[#6B7280] leading-[22px]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="absolute bottom-0 inset-x-0 p-6 pb-8 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
            <div className="flex justify-center gap-2 mb-4 pointer-events-auto">
              {onboardingSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStep ? 'w-8 bg-primary' : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              className="w-full h-14 text-[17px] font-semibold rounded-full shadow-lg pointer-events-auto"
            >
              {currentStep < onboardingSteps.length - 1 ? 'Next' : "Let's Start"}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
