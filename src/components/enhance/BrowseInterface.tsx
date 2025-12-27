import { useState, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useFlowNavigation } from '@/hooks/useFlowNavigation';
import { EntryPointScreen } from '@/components/flow/EntryPointScreen';
import { SingleQuestionScreen } from '@/components/flow/SingleQuestionScreen';
import { SelectionScreen } from '@/components/flow/SelectionScreen';
import { PreferenceScreen } from '@/components/flow/PreferenceScreen';
import { ResultsScreen } from '@/components/flow/ResultsScreen';
import { LoadingScreen } from '@/components/flow/LoadingScreen';
import { SimpleLoadingScreen } from '@/components/flow/SimpleLoadingScreen';
import { ProgressIndicator } from '@/components/flow/ProgressIndicator';
import { FriendRecognitionFlow } from '@/components/flow/FriendRecognitionFlow';
import { KnownFriendProductSelection } from '@/components/flow/KnownFriendProductSelection';
import { BudgetSlider } from '@/components/flow/BudgetSlider';
import { GenderSelection } from '@/components/flow/GenderSelection';
import { AgeSelection } from '@/components/flow/AgeSelection';
import { InterestsSelection } from '@/components/flow/InterestsSelection';
import { NewFriendInterestsScreen } from '@/components/flow/NewFriendInterestsScreen';
import { AIProductFinder } from '@/components/AIProductFinder';
import sourDillLogo from '@/assets/sour-dillmas-logo.png';
import chatData from '@/data/chat-data.json';

interface BrowseInterfaceProps {
  onBack: () => void;
  userName: string;
}

interface KnownFriend {
  id: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
  purchaseHistory: { item: string; occasion: string }[];
}

type FriendFlowStep =
  | 'normal'
  | 'friend_recognition'
  // YES flow
  | 'loading_checking_friends'
  | 'select_friend'
  | 'loading_friend_data'
  | 'known_friend_selected'
  | 'loading_prepare'
  | 'budget_for_known_friend'
  | 'loading_occasion_check'
  | 'occasion_for_known_friend'
  // NO flow
  | 'loading_create_profile'
  | 'new_friend_gender'
  | 'loading_after_gender'
  | 'new_friend_age'
  | 'loading_before_interests'
  | 'new_friend_interests'
  | 'loading_after_interests'
  | 'new_friend_budget'
  | 'loading_new_friend_occasion_check'
  | 'new_friend_occasion';

export function BrowseInterface({ onBack, userName }: BrowseInterfaceProps) {
  const [friendFlowStep, setFriendFlowStep] = useState<FriendFlowStep>('normal');
  const [selectedKnownFriend, setSelectedKnownFriend] = useState<KnownFriend | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isFindingProducts, setIsFindingProducts] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showMoreOccasions, setShowMoreOccasions] = useState(false);
  const [occasionSearch, setOccasionSearch] = useState('');
  const [showOccasionSearch, setShowOccasionSearch] = useState(false);

  // New friend data (NO flow)
  const [newFriendGender, setNewFriendGender] = useState<string | null>(null);
  const [newFriendAge, setNewFriendAge] = useState<string | null>(null);
  const [newFriendInterests, setNewFriendInterests] = useState<string[]>([]);
  const [newFriendBudget, setNewFriendBudget] = useState<string | null>(null);
  const [newFriendOccasion, setNewFriendOccasion] = useState<string | null>(null);
  
  const {
    state,
    setState,
    entryPoints,
    questions,
    currentQuestion,
    categories,
    loadMoreCategories,
    loadMoreRecipients,
    allBrowsingCategories,
    subcategories,
    allSubcategories,
    preferences,
    results,
    selectEntryPoint,
    answerQuestion,
    skipToCategories,
    selectCategory,
    selectSubcategory,
    selectPreference,
    completeLoading,
    saveSession,
    resetFlow,
    goBack,
  } = useFlowNavigation();

  const handleAnswerQuestion = (answer: string | number) => {
    // For "Myself" flow (budget question), go directly to answerQuestion
    // which will trigger the proper loading screen
    if (currentQuestion?.key === 'budget' && state.entryPoint === 'myself') {
      answerQuestion(answer);
      return;
    }

    // Special handling for friend selection
    if (currentQuestion?.key === 'forWhom' && answer === 'friend') {
      setFriendFlowStep('friend_recognition');
      return;
    }

    // For "others" and "browsing" flows, we have custom loading screens, so don't show the generic overlay
    const isOthersFlow = state.entryPoint === 'others';
    const isBrowsingFlow = state.entryPoint === 'browsing';

    if (isOthersFlow || isBrowsingFlow) {
      answerQuestion(answer);
    } else {
      setIsAIThinking(true);

      setTimeout(() => {
        setIsAIThinking(false);
        answerQuestion(answer);
      }, 2000);
    }
  };

  const handleYesClick = () => {
    setFriendFlowStep('loading_checking_friends');
  };

  const handleSelectKnownFriend = (friend: KnownFriend) => {
    setSelectedKnownFriend(friend);
    setFriendFlowStep('loading_friend_data');
  };

  const handleSelectNewFriend = () => {
    setFriendFlowStep('loading_create_profile');
  };

  const handleContinueFromKnownFriend = () => {
    setFriendFlowStep('loading_prepare');
  };

  const handleBudgetForKnownFriend = (budget: string) => {
    setSelectedBudget(budget);
    setFriendFlowStep('loading_occasion_check');
  };

  const handleOccasionForKnownFriend = (occasion: string) => {
    if (selectedKnownFriend && selectedBudget) {
      // Store the answers in state
      setState(prev => ({
        ...prev,
        questionAnswers: {
          forWhom: 'friend',
          gender: selectedKnownFriend.gender,
          age: selectedKnownFriend.age,
          budget: selectedBudget,
          occasion: occasion
        },
        currentStep: 'loading_categories',
        stepHistory: [...prev.stepHistory, 'loading_categories'],
        currentStepNumber: prev.currentStepNumber + 1,
      }));
      setFriendFlowStep('normal');
    }
  };

  // New friend flow handlers
  const handleNewFriendGender = (gender: string) => {
    setNewFriendGender(gender);
    setFriendFlowStep('loading_after_gender');
  };

  const handleNewFriendAge = (age: string) => {
    setNewFriendAge(age);
    setFriendFlowStep('loading_before_interests');
  };

  const handleNewFriendInterests = (interests: string[]) => {
    setNewFriendInterests(interests);
    setFriendFlowStep('loading_after_interests');
  };

  const handleNewFriendBudget = (budget: string) => {
    setNewFriendBudget(budget);
    setFriendFlowStep('loading_new_friend_occasion_check');
  };

  const handleNewFriendOccasion = (occasion: string) => {
    setNewFriendOccasion(occasion);
    if (newFriendGender && newFriendAge && newFriendBudget) {
      // Store the answers in state
      setState(prev => ({
        ...prev,
        questionAnswers: {
          forWhom: 'friend',
          gender: newFriendGender,
          age: parseInt(newFriendAge),
          budget: newFriendBudget,
          occasion: occasion
        },
        currentStep: 'loading_categories',
        stepHistory: [...prev.stepHistory, 'loading_categories'],
        currentStepNumber: prev.currentStepNumber + 1,
      }));
      setFriendFlowStep('normal');
    }
  };

  const handleReset = () => {
    resetFlow();
    setFriendFlowStep('normal');
    setSelectedKnownFriend(null);
    setSelectedBudget(null);
    setIsFindingProducts(false);
    setShowResults(false);
    setShowMoreOccasions(false);
    setOccasionSearch('');
    setShowOccasionSearch(false);
    // Reset new friend data
    setNewFriendGender(null);
    setNewFriendAge(null);
    setNewFriendInterests([]);
    setNewFriendBudget(null);
    setNewFriendOccasion(null);
  };

  const handlePreferenceSelect = (option: string) => {
    selectPreference(option);
    setIsFindingProducts(true);
    setShowResults(false);
  };

  const handleProductFinderComplete = useCallback(() => {
    setIsFindingProducts(false);
    setShowResults(true);
  }, []);

  const renderCurrentStep = () => {
    if (friendFlowStep === 'friend_recognition') {
      return (
        <div className="py-2">
          <FriendRecognitionFlow
            onSelectKnownFriend={handleSelectKnownFriend}
            onSelectNewFriend={handleSelectNewFriend}
            onYesClick={handleYesClick}
          />
        </div>
      );
    }

    if (friendFlowStep === 'loading_checking_friends') {
      return (
        <SimpleLoadingScreen
          message="SweetDill AI is checking data on your friends..."
          onComplete={() => setFriendFlowStep('select_friend')}
          duration={3500}
        />
      );
    }

    if (friendFlowStep === 'select_friend') {
      return (
        <div className="py-2">
          <FriendRecognitionFlow
            onSelectKnownFriend={handleSelectKnownFriend}
            onSelectNewFriend={handleSelectNewFriend}
            initialStep="select_friend"
          />
        </div>
      );
    }

    if (friendFlowStep === 'loading_friend_data' && selectedKnownFriend) {
      return (
        <SimpleLoadingScreen
          message={`SweetDill AI is collecting historical data on ${selectedKnownFriend.name}...`}
          onComplete={() => setFriendFlowStep('known_friend_selected')}
          duration={3500}
        />
      );
    }

    if (friendFlowStep === 'known_friend_selected' && selectedKnownFriend) {
      return (
        <KnownFriendProductSelection
          friend={selectedKnownFriend}
          onContinue={handleContinueFromKnownFriend}
        />
      );
    }

    if (friendFlowStep === 'loading_prepare' && selectedKnownFriend) {
      return (
        <SimpleLoadingScreen
          message="Lets prepare everything..."
          onComplete={() => setFriendFlowStep('budget_for_known_friend')}
          duration={3500}
        />
      );
    }

    if (friendFlowStep === 'budget_for_known_friend' && selectedKnownFriend) {
      return (
        <BudgetSlider onSelect={handleBudgetForKnownFriend} />
      );
    }

    if (friendFlowStep === 'loading_occasion_check' && selectedKnownFriend) {
      return (
        <SimpleLoadingScreen
          message="Let me check if there is any specific occasion, nothing in my memory..."
          onComplete={() => setFriendFlowStep('occasion_for_known_friend')}
          duration={3500}
        />
      );
    }

    if (friendFlowStep === 'occasion_for_known_friend' && selectedKnownFriend) {
      const allOccasions = [
        { label: "Birthday", value: "birthday" },
        { label: "Anniversary", value: "anniversary" },
        { label: "Wedding", value: "wedding" },
        { label: "Graduation", value: "graduation" },
        { label: "Christmas", value: "christmas" },
        { label: "Valentine's Day", value: "valentines_day" },
        { label: "Mother's Day", value: "mothers_day" },
        { label: "Father's Day", value: "fathers_day" },
        { label: "Just Because", value: "just_because" }
      ];

      const mainOccasions = allOccasions.slice(0, 4);
      const moreOccasions = allOccasions.slice(4);

      const searchResults = occasionSearch.trim()
        ? allOccasions.filter(opt =>
            opt.label.toLowerCase().includes(occasionSearch.toLowerCase())
          )
        : [];

      return (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Any specific occasion?
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search occasions..."
                value={occasionSearch}
                onChange={(e) => {
                  setOccasionSearch(e.target.value);
                  setShowOccasionSearch(e.target.value.trim().length > 0);
                }}
                onFocus={() => setShowOccasionSearch(occasionSearch.trim().length > 0)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Search results dropdown */}
            {showOccasionSearch && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border/50 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.value}
                    onClick={() => {
                      handleOccasionForKnownFriend(result.value);
                      setOccasionSearch('');
                      setShowOccasionSearch(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {result.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
            {mainOccasions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOccasionForKnownFriend(option.value)}
                className="group flex items-center justify-center p-5 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
              >
                <span className="font-medium text-center">
                  {option.label}
                </span>
              </button>
            ))}

            {showMoreOccasions && moreOccasions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOccasionForKnownFriend(option.value)}
                className="group flex items-center justify-center p-5 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
              >
                <span className="font-medium text-center">
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          {/* Load More button */}
          {moreOccasions.length > 0 && (
            <button
              onClick={() => setShowMoreOccasions(!showMoreOccasions)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {showMoreOccasions ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Load More
                </>
              )}
            </button>
          )}
        </div>
      );
    }

    // NO flow - New friend
    if (friendFlowStep === 'loading_create_profile') {
      return (
        <SimpleLoadingScreen
          message="SweetDill AI will ask some questions to create a profile for your friend..."
          onComplete={() => setFriendFlowStep('new_friend_gender')}
          duration={3500}
        />
      );
    }

    if (friendFlowStep === 'new_friend_gender') {
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              What is their gender?
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {[
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
              { label: "Other", value: "other" }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleNewFriendGender(option.value)}
                className="group flex items-center justify-center p-5 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
              >
                <span className="font-medium text-center">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (friendFlowStep === 'loading_after_gender') {
      return (
        <SimpleLoadingScreen
          message="SweetDill AI thinking..."
          onComplete={() => setFriendFlowStep('new_friend_age')}
          duration={3500}
        />
      );
    }

    if (friendFlowStep === 'new_friend_age') {
      const genderPronoun = newFriendGender === 'male' ? 'him' : newFriendGender === 'female' ? 'her' : 'them';
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              How old is {genderPronoun}?
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
            {[
              { label: "Under 18", value: "under_18" },
              { label: "18-25", value: "18_25" },
              { label: "26-35", value: "26_35" },
              { label: "36-45", value: "36_45" },
              { label: "46-55", value: "46_55" },
              { label: "56-65", value: "56_65" },
              { label: "Over 65", value: "over_65" }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleNewFriendAge(option.value)}
                className="group flex items-center justify-center p-5 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
              >
                <span className="font-medium text-center">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (friendFlowStep === 'loading_before_interests') {
      const friendName = newFriendGender === 'male' ? 'him' : newFriendGender === 'female' ? 'her' : 'them';
      return (
        <SimpleLoadingScreen
          message={`SweetDill AI wants to know about ${friendName} interests.`}
          onComplete={() => setFriendFlowStep('new_friend_interests')}
          duration={3500}
        />
      );
    }

    if (friendFlowStep === 'new_friend_interests') {
      return (
        <NewFriendInterestsScreen
          selectedInterests={newFriendInterests}
          onContinue={handleNewFriendInterests}
        />
      );
    }

    if (friendFlowStep === 'loading_after_interests') {
      return (
        <SimpleLoadingScreen
          message="SweetDill AI thinking..."
          onComplete={() => setFriendFlowStep('new_friend_budget')}
          duration={3500}
        />
      );
    }

    if (friendFlowStep === 'new_friend_budget') {
      return (
        <BudgetSlider onSelect={handleNewFriendBudget} />
      );
    }

    if (friendFlowStep === 'loading_new_friend_occasion_check') {
      return (
        <SimpleLoadingScreen
          message="Let me check if there is any specific occasion, nothing in my memory..."
          onComplete={() => setFriendFlowStep('new_friend_occasion')}
          duration={3500}
        />
      );
    }

    if (friendFlowStep === 'new_friend_occasion') {
      const allOccasions = [
        { label: "Birthday", value: "birthday" },
        { label: "Anniversary", value: "anniversary" },
        { label: "Wedding", value: "wedding" },
        { label: "Graduation", value: "graduation" },
        { label: "Christmas", value: "christmas" },
        { label: "Valentine's Day", value: "valentines_day" },
        { label: "Mother's Day", value: "mothers_day" },
        { label: "Father's Day", value: "fathers_day" },
        { label: "Just Because", value: "just_because" }
      ];

      const mainOccasions = allOccasions.slice(0, 4);
      const moreOccasions = allOccasions.slice(4);

      const searchResults = occasionSearch.trim()
        ? allOccasions.filter(opt =>
            opt.label.toLowerCase().includes(occasionSearch.toLowerCase())
          )
        : [];

      return (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Any specific occasion?
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search occasions..."
                value={occasionSearch}
                onChange={(e) => {
                  setOccasionSearch(e.target.value);
                  setShowOccasionSearch(e.target.value.trim().length > 0);
                }}
                onFocus={() => setShowOccasionSearch(occasionSearch.trim().length > 0)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Search results dropdown */}
            {showOccasionSearch && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border/50 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.value}
                    onClick={() => {
                      handleNewFriendOccasion(result.value);
                      setOccasionSearch('');
                      setShowOccasionSearch(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {result.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
            {mainOccasions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleNewFriendOccasion(option.value)}
                className="group flex items-center justify-center p-5 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
              >
                <span className="font-medium text-center">
                  {option.label}
                </span>
              </button>
            ))}

            {showMoreOccasions && moreOccasions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleNewFriendOccasion(option.value)}
                className="group flex items-center justify-center p-5 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
              >
                <span className="font-medium text-center">
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          {/* Load More button */}
          {moreOccasions.length > 0 && (
            <button
              onClick={() => setShowMoreOccasions(!showMoreOccasions)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {showMoreOccasions ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Load More
                </>
              )}
            </button>
          )}
        </div>
      );
    }

    switch (state.currentStep) {
      case 'entry':
        return <EntryPointScreen entryPoints={entryPoints} onSelect={selectEntryPoint} />;
      case 'loading_browsing_welcome':
        return (
          <SimpleLoadingScreen
            message="Let's see what you might be interested in today"
            onComplete={completeLoading}
            duration={3500}
          />
        );
      case 'loading_browsing_data':
        return (
          <SimpleLoadingScreen
            message="SweetDill AI is collecting historical data on you..."
            onComplete={completeLoading}
            duration={3500}
          />
        );
      case 'questions':
        if (!currentQuestion) return null;
        return (
          <SingleQuestionScreen
            question={currentQuestion}
            questionNumber={state.currentQuestionIndex}
            totalQuestions={questions.length}
            onAnswer={handleAnswerQuestion}
            loadMoreOptions={loadMoreRecipients}
            selectedRecipient={state.questionAnswers['forWhom'] as string}
          />
        );
      case 'loading_recipient_info': {
        const recipientName = state.questionAnswers['forWhom'] as string;
        return (
          <SimpleLoadingScreen
            message={`I need to know more about your ${recipientName}...`}
            onComplete={completeLoading}
            duration={3500}
          />
        );
      }
      case 'loading_ai_thinking':
        return (
          <SimpleLoadingScreen
            message="SweetDill AI is thinking..."
            onComplete={completeLoading}
            duration={3500}
          />
        );
      case 'loading_interests_check': {
        const recipient = state.questionAnswers['forWhom'] as string;
        return (
          <SimpleLoadingScreen
            message={`Let me check if you mentioned anything about your ${recipient}'s interests...`}
            onComplete={completeLoading}
            duration={3500}
          />
        );
      }
      case 'loading_categories': {
        let loadingMessage = "Based on what I know about you, you will be interested in these categories";
        let emphasizeMessage = "Based on what I know about you";

        if (selectedKnownFriend) {
          const pronoun = selectedKnownFriend.gender === 'male' ? 'he' : selectedKnownFriend.gender === 'female' ? 'she' : 'they';
          loadingMessage = `Based on what I know about ${selectedKnownFriend.name}, ${pronoun} will be interested in these categories`;
          emphasizeMessage = `Based on what I know about ${selectedKnownFriend.name}`;
        } else if (newFriendGender) {
          const pronoun = newFriendGender === 'male' ? 'he' : newFriendGender === 'female' ? 'she' : 'they';
          loadingMessage = `Based on what I have learned about your friend, ${pronoun} will be interested in these categories`;
          emphasizeMessage = `Based on what I have learned about your friend`;
        }

        return (
          <SimpleLoadingScreen
            message={loadingMessage}
            emphasizeText={emphasizeMessage}
            onComplete={completeLoading}
            duration={3500}
          />
        );
      }
      case 'categories': {
        let categoryTitle = "My knowledge shows you might be interested in one of these categories.";
        let categorySubtitle: string | undefined = undefined;

        if (selectedKnownFriend) {
          categoryTitle = `For ${selectedKnownFriend.name}?`;
          categorySubtitle = `Interests: ${selectedKnownFriend.interests.join(', ')}`;
        } else if (newFriendInterests.length > 0) {
          categoryTitle = "For your friend?";
          categorySubtitle = `Interests: ${newFriendInterests.join(', ')}`;
        }

        return (
          <SelectionScreen
            title={categoryTitle}
            subtitle={categorySubtitle}
            options={categories}
            onSelect={selectCategory}
            loadMoreOptions={loadMoreCategories}
            showSearch={true}
            allOptions={allBrowsingCategories}
          />
        );
      }
      case 'loading_subcategories': {
        const categoryName = state.category ? state.category.replace(/_/g, ' ') : 'this category';
        let subcatMessage = `Sweet Dill AI is checking the product type related to ${categoryName} and your interests...`;

        if (selectedKnownFriend) {
          subcatMessage = `Sweet Dill AI is checking the product type related to ${categoryName} and ${selectedKnownFriend.name} interests...`;
        } else if (newFriendGender) {
          subcatMessage = `Sweet Dill AI is checking the product type related to ${categoryName} and your friend interests...`;
        }

        return (
          <SimpleLoadingScreen
            message={subcatMessage}
            onComplete={completeLoading}
            duration={3500}
          />
        );
      }
      case 'subcategories': {
        // Get load more subcategories (items after first 4)
        const loadMoreSubcats = subcategories.slice(4).map(s => s.key);
        return (
          <SelectionScreen
            title="How do you think about these products?"
            subtitle="Select a specific product type"
            options={subcategories.slice(0, 4)}
            onSelect={selectSubcategory}
            loadMoreOptions={loadMoreSubcats}
            showSearch={true}
            allOptions={allSubcategories}
          />
        );
      }
      case 'loading_results':
        return (
          <LoadingScreen
            message="Finding the best option for you..."
            onComplete={completeLoading}
            duration={8000}
          />
        );
      case 'preferences':
        if (!preferences) {
          return (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-xs">No preferences available.</p>
            </div>
          );
        }
        return <PreferenceScreen preference={preferences} onSelect={handlePreferenceSelect} />;
      case 'results':
        if (state.entryPoint === 'myself' || state.entryPoint === 'others' || state.entryPoint === 'browsing') {
          if (!results) {
            return (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-muted-foreground">No products available.</p>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs hover:bg-primary/90 transition-colors"
                >
                  Start Over
                </button>
              </div>
            );
          }
          return <ResultsScreen results={results} state={state} onReset={handleReset} onSave={saveSession} />;
        }

        if (isFindingProducts) {
          return null;
        }
        if (!showResults && !isFindingProducts) {
          setIsFindingProducts(true);
          return null;
        }
        if (!results) {
          return (
            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-muted-foreground">No products available.</p>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs hover:bg-primary/90 transition-colors"
              >
                Start Over
              </button>
            </div>
          );
        }
        return <ResultsScreen results={results} state={state} onReset={handleReset} onSave={saveSession} />;
      default:
        return null;
    }
  };

  const handleBack = () => {
    // YES flow (known friend)
    if (friendFlowStep === 'occasion_for_known_friend') {
      setFriendFlowStep('loading_occasion_check');
      return;
    }
    if (friendFlowStep === 'loading_occasion_check') {
      setFriendFlowStep('budget_for_known_friend');
      return;
    }
    if (friendFlowStep === 'budget_for_known_friend') {
      setFriendFlowStep('loading_prepare');
      return;
    }
    if (friendFlowStep === 'loading_prepare') {
      setFriendFlowStep('known_friend_selected');
      return;
    }
    if (friendFlowStep === 'known_friend_selected') {
      setFriendFlowStep('loading_friend_data');
      return;
    }
    if (friendFlowStep === 'loading_friend_data') {
      setFriendFlowStep('select_friend');
      return;
    }
    if (friendFlowStep === 'select_friend') {
      setFriendFlowStep('loading_checking_friends');
      return;
    }
    if (friendFlowStep === 'loading_checking_friends') {
      setFriendFlowStep('friend_recognition');
      return;
    }

    // NO flow (new friend)
    if (friendFlowStep === 'new_friend_occasion') {
      setFriendFlowStep('loading_new_friend_occasion_check');
      return;
    }
    if (friendFlowStep === 'loading_new_friend_occasion_check') {
      setFriendFlowStep('new_friend_budget');
      return;
    }
    if (friendFlowStep === 'new_friend_budget') {
      setFriendFlowStep('loading_after_interests');
      return;
    }
    if (friendFlowStep === 'loading_after_interests') {
      setFriendFlowStep('new_friend_interests');
      return;
    }
    if (friendFlowStep === 'new_friend_interests') {
      setFriendFlowStep('loading_before_interests');
      return;
    }
    if (friendFlowStep === 'loading_before_interests') {
      setFriendFlowStep('new_friend_age');
      return;
    }
    if (friendFlowStep === 'new_friend_age') {
      setFriendFlowStep('loading_after_gender');
      return;
    }
    if (friendFlowStep === 'loading_after_gender') {
      setFriendFlowStep('new_friend_gender');
      return;
    }
    if (friendFlowStep === 'new_friend_gender') {
      setFriendFlowStep('loading_create_profile');
      return;
    }
    if (friendFlowStep === 'loading_create_profile') {
      setFriendFlowStep('friend_recognition');
      return;
    }

    // Both flows
    if (friendFlowStep === 'friend_recognition') {
      setFriendFlowStep('normal');
      return;
    }

    // If we're at the entry step, go back to welcome screen
    if (state.currentStep === 'entry') {
      onBack();
      return;
    }

    // Otherwise, go back one step in the flow
    goBack();
  };

  return (
    <div className="flex flex-col h-full px-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-2.5 bg-card rounded-xl shadow-card border border-border/30 mb-2 shrink-0">
        <button
          onClick={handleBack}
          className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-foreground" />
        </button>
        <div className="flex-1">
          <h3 className="font-medium text-foreground text-xs">Browse & Select</h3>
          <p className="text-[10px] text-muted-foreground">
            {selectedKnownFriend
              ? `For ${selectedKnownFriend.name}`
              : newFriendGender
                ? 'For your friend'
                : 'Step by step'}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="px-2 py-1 rounded-full bg-secondary/50 flex items-center gap-1 hover:bg-secondary transition-colors"
        >
          <RotateCcw className="w-3 h-3 text-foreground" />
          <span className="text-[10px] text-foreground">Start Over</span>
        </button>
      </div>

      {/* Progress */}
      {state.currentStep !== 'entry' &&
       state.currentStep !== 'results' &&
       state.currentStep !== 'loading_browsing_welcome' &&
       state.currentStep !== 'loading_browsing_data' &&
       state.currentStep !== 'loading_recipient_info' &&
       state.currentStep !== 'loading_ai_thinking' &&
       state.currentStep !== 'loading_interests_check' &&
       state.currentStep !== 'loading_categories' &&
       state.currentStep !== 'loading_subcategories' &&
       state.currentStep !== 'loading_results' &&
       friendFlowStep === 'normal' &&
       friendFlowStep !== 'loading_checking_friends' &&
       friendFlowStep !== 'loading_friend_data' &&
       friendFlowStep !== 'loading_prepare' &&
       friendFlowStep !== 'loading_occasion_check' &&
       friendFlowStep !== 'loading_create_profile' &&
       friendFlowStep !== 'loading_after_gender' &&
       friendFlowStep !== 'loading_before_interests' &&
       friendFlowStep !== 'loading_after_interests' &&
       friendFlowStep !== 'loading_new_friend_occasion_check' && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-2 border border-primary/20 mb-2 shrink-0">
          <ProgressIndicator
            currentStep={state.currentStepNumber}
            totalSteps={state.totalSteps}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center min-h-0">
        <div className="bg-card rounded-xl p-3 shadow-card border border-border/30 relative overflow-auto min-h-[300px] max-h-full">
          {isAIThinking && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md animate-fade-in rounded-xl">
              <div className="flex flex-col items-center gap-4">
                {/* Animated logo container */}
                <div className="relative">
                  {/* Pulsing glow ring */}
                  <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/20 animate-ping" />
                  <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/30 animate-pulse" />

                  {/* Logo with bounce animation */}
                  <div className="relative w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center animate-bounce border-2 border-primary/30" style={{ animationDuration: '1.5s' }}>
                    <img
                      src={sourDillLogo}
                      alt="Sweet Dill thinking"
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                </div>

                {/* Text with shimmer effect */}
                <div className="flex flex-col items-center gap-1">
                  <p className="text-sm font-semibold text-foreground">
                    SweetDill AI is thinking...
                  </p>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <AIProductFinder
            isVisible={isFindingProducts}
            onComplete={handleProductFinderComplete}
          />

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-8 -mt-8" />
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-accent/5 rounded-full -ml-6 -mb-6" />

          <div className="relative z-10">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </div>
  );
}
