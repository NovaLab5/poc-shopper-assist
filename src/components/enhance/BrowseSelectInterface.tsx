import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Flame, Watch, Loader2, Check, User, Users, RotateCcw, Smartphone, Laptop, Headphones, Camera, Tv, Home, Shirt, Dumbbell, Book, Utensils, Gem, Sparkles } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useFlowNavigation } from '@/hooks/useFlowNavigation';
import { EntryPointScreen } from '@/components/flow/EntryPointScreen';
import { SingleQuestionScreen } from '@/components/flow/SingleQuestionScreen';
import { SelectionScreen } from '@/components/flow/SelectionScreen';
import { PreferenceScreen } from '@/components/flow/PreferenceScreen';
import { ResultsScreen } from '@/components/flow/ResultsScreen';
import { LoadingScreen } from '@/components/flow/LoadingScreen';
import sourDillLogo from '@/assets/sour-dillmas-logo.png';
import { getPersonaByType, savePersona, getPersonasByType, type Persona } from '@/services/personaService';
import { getProductsByCategory, transformProductsForComponent, getCategoryPriceRange } from '@/services/productService';

interface BrowseSelectInterfaceProps {
  onBack: () => void;
  userName: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  store: string;
  image: string;
  rating: number;
  url: string;
}

const CATEGORIES = [
  // Popular categories from database
  { id: 'grills', label: 'Grills', icon: Flame },
  { id: 'laptops', label: 'Laptops', icon: Laptop },
  { id: 'headphones', label: 'Headphones', icon: Headphones },
  { id: 'smartphones', label: 'Smartphones', icon: Smartphone },
  { id: 'tv', label: 'TVs', icon: Tv },
  { id: 'camera', label: 'Cameras', icon: Camera },
  { id: 'watches', label: 'Watches', icon: Watch },
  { id: 'socks', label: 'Socks', icon: Shirt },
  { id: 'pajamas', label: 'Pajamas', icon: Shirt },
  { id: 'board-games', label: 'Board Games', icon: Book },
  { id: 'running-gear', label: 'Running Gear', icon: Dumbbell },
  { id: 'travel-gear-and-accessories', label: 'Travel Gear', icon: Gem },
  { id: 'home-office-furniture-and-supplies', label: 'Home Office', icon: Home },
  { id: 'luxurious-gifts', label: 'Luxury Gifts', icon: Sparkles },
  { id: 'anniversary-gifts', label: 'Anniversary Gifts', icon: Gem },
  { id: 'retirement-gifts', label: 'Retirement Gifts', icon: Gem },
  { id: 'self-care-gifts-for-yourself', label: 'Self Care', icon: Sparkles },
  { id: '25-kids-birthday-party-favors', label: 'Kids Party Favors', icon: Gem },
  { id: 'college-dorm-essentials', label: 'Dorm Essentials', icon: Home },
  { id: 'tinned-fish', label: 'Tinned Fish', icon: Utensils },
];

// Flow steps for "Myself"
type MyselfFlowStep = 'entry' | 'initial_loading' | 'category_budget' | 'results_loading' | 'results';

// Flow steps for "Others" (non-friend flow)
type OthersFlowStep =
  | 'entry'
  | 'who_to_shop_for'
  | 'loading_checking_data'
  | 'loading_no_info'
  | 'loading_found_persona'
  | 'loading_persona_info'
  | 'loading_preparing'
  | 'select_friend'
  | 'ask_name'
  | 'ask_age'
  | 'ask_gender'
  | 'ask_interests'
  | 'ask_preferences'
  | 'results_loading'
  | 'results';

export function BrowseSelectInterface({ onBack, userName }: BrowseSelectInterfaceProps) {
  // Common state
  const [selectedEntryPoint, setSelectedEntryPoint] = useState<string>('');

  // "Myself" flow state
  const [myselfStep, setMyselfStep] = useState<MyselfFlowStep>('entry');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [budget, setBudget] = useState<number>(500);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 50, max: 1000 });
  const [priceRangeCache, setPriceRangeCache] = useState<Record<string, { min: number; max: number }>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);
  const [visibleProductCount, setVisibleProductCount] = useState(1);
  const [randomNumbers, setRandomNumbers] = useState({ resources: 0, reviews: 0 });

  // "Others" flow state
  const [othersStep, setOthersStep] = useState<OthersFlowStep>('entry');
  const [personaType, setPersonaType] = useState<string>(''); // mother, father, boss, etc.
  const [personaName, setPersonaName] = useState<string>('');
  const [personaAge, setPersonaAge] = useState<number>(50);
  const [personaGender, setPersonaGender] = useState<string>('');
  const [personaInterests, setPersonaInterests] = useState<string[]>([]);
  const [othersBudget, setOthersBudget] = useState<number>(500);
  const [othersCategory, setOthersCategory] = useState<string>('');
  const [othersOccasion, setOthersOccasion] = useState<string>('');

  // Current persona from database
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null);

  // Friend selection state
  const [friendsList, setFriendsList] = useState<Persona[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState<string>('');
  const [friendsLoaded, setFriendsLoaded] = useState<boolean>(false);

  // Separate search queries for category and occasion
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [occasionSearchQuery, setOccasionSearchQuery] = useState<string>('');

  const { entryPoints } = useFlowNavigation();

  // Filtered categories based on category search query
  // Show only Laptops and Grills by default, show all matching categories when searching
  const filteredCategories = categorySearchQuery.trim()
    ? CATEGORIES.filter(cat =>
        cat.label.toLowerCase().includes(categorySearchQuery.toLowerCase())
      )
    : CATEGORIES.filter(cat => cat.id === 'laptops' || cat.id === 'grills'); // Show only Laptops and Grills by default

  // Handle entry point selection
  const handleEntryPointSelect = (entry: string) => {
    setSelectedEntryPoint(entry);
    if (entry === 'myself') {
      setMyselfStep('initial_loading');
    } else if (entry === 'others') {
      setOthersStep('who_to_shop_for');
    }
  };

  // Reset function
  const handleReset = () => {
    setSelectedEntryPoint('');
    setMyselfStep('entry');
    setOthersStep('entry');
    setSearchQuery('');
    setSelectedCategory('');
    setBudget(500);
    setProducts([]);
    setVisibleProductCount(1);
    setPersonaType('');
    setPersonaName('');
    setPersonaAge(50);
    setPersonaGender('');
    setPersonaInterests([]);
    setOthersBudget(500);
    setOthersCategory('');
    setOthersOccasion('');
  };

  // Pre-fetch price ranges for default categories (Laptops and Grills)
  useEffect(() => {
    const prefetchPriceRanges = async () => {
      const defaultCategories = ['laptops', 'grills'];
      for (const categoryId of defaultCategories) {
        try {
          const range = await getCategoryPriceRange(categoryId);
          if (range.count > 0) {
            setPriceRangeCache(prev => ({
              ...prev,
              [categoryId]: { min: range.minPrice, max: range.maxPrice }
            }));
          }
        } catch (error) {
          console.error(`Error pre-fetching price range for ${categoryId}:`, error);
        }
      }
    };

    prefetchPriceRanges();
  }, []);

  // Step 1: Initial loading screen (4 seconds) - only for "Myself" flow
  useEffect(() => {
    if (myselfStep === 'initial_loading' && selectedEntryPoint === 'myself') {
      const timer = setTimeout(() => {
        setMyselfStep('category_budget');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [myselfStep, selectedEntryPoint]);

  const handleFindDeals = () => {
    // Products will be loaded from API
    setMyselfStep('results_loading');
  };

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);

    // Check cache first
    if (priceRangeCache[categoryId]) {
      const cached = priceRangeCache[categoryId];
      setPriceRange(cached);
      const initialBudget = cached.max <= 100 ? cached.max : Math.floor((cached.min + cached.max) / 2);
      setBudget(initialBudget);
      return;
    }

    // Fetch price range for the selected category
    try {
      const range = await getCategoryPriceRange(categoryId);
      if (range.count > 0) {
        const newRange = { min: range.minPrice, max: range.maxPrice };
        setPriceRange(newRange);
        setPriceRangeCache(prev => ({ ...prev, [categoryId]: newRange }));
        // Set initial budget to middle of range or max if range is small
        const initialBudget = range.maxPrice <= 100 ? range.maxPrice : Math.floor((range.minPrice + range.maxPrice) / 2);
        setBudget(initialBudget);
      } else {
        // No products in category, use defaults
        setPriceRange({ min: 50, max: 1000 });
        setBudget(500);
      }
    } catch (error) {
      console.error('Error fetching price range:', error);
      // Use defaults on error
      setPriceRange({ min: 50, max: 1000 });
      setBudget(500);
    }
  };

  const handleShowNextProduct = () => {
    setVisibleProductCount(prev => Math.min(prev + 1, products.length));
  };

  const renderInitialLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-8">
      <div className="relative mb-6">
        <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/20 animate-ping" />
        <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/30 animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center animate-bounce border-2 border-primary/30" style={{ animationDuration: '1.5s' }}>
          <img src={sourDillLogo} alt="Sweet Dill" className="w-14 h-14 object-contain" />
        </div>
      </div>
      <p className="text-lg font-semibold text-foreground text-center">
        SweetDill analyzing and retrieving your past conversation and data
      </p>
    </div>
  );

  const renderCategoryBudget = () => (
    <div className="space-y-6 animate-fade-in px-4 py-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          What are you looking for?
        </h2>
        <p className="text-sm text-muted-foreground">
          Select a category and set your budget
        </p>
      </div>

      {/* Selected Category Display */}
      {selectedCategory && (
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
            {(() => {
              const selectedCat = CATEGORIES.find(cat => cat.id === selectedCategory);
              const Icon = selectedCat?.icon || Gem;
              return (
                <>
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary flex-1">
                    {selectedCat?.label || selectedCategory}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setPriceRange({ min: 50, max: 1000 });
                      setBudget(500);
                    }}
                    className="text-primary hover:text-primary/70 text-xs"
                  >
                    Change
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Category Search Bar */}
      {!selectedCategory && (
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search categories..."
            value={categorySearchQuery}
            onChange={(e) => setCategorySearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-3 text-sm rounded-lg border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      {/* Category List/Pills - Show as list when searching, pills when not */}
      {!selectedCategory && categorySearchQuery.trim() ? (
        // List view when searching
        <div className="max-w-md mx-auto">
          {filteredCategories.length > 0 ? (
            <div className="bg-card border border-border/50 rounded-lg overflow-hidden">
              {filteredCategories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/30 last:border-b-0 ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-secondary/50 text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{category.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No categories found</p>
              <button
                onClick={() => setCategorySearchQuery('')}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      ) : !selectedCategory ? (
        // Pills view when not searching (default)
        <div className="flex flex-wrap gap-3 justify-center max-w-md mx-auto">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50"
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Budget Slider */}
      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Budget</label>
            <span className="text-lg font-bold text-primary">${budget}</span>
          </div>
          <Slider
            value={[budget]}
            onValueChange={(values) => setBudget(values[0])}
            min={priceRange.min}
            max={priceRange.max}
            step={Math.max(1, Math.floor((priceRange.max - priceRange.min) / 20))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${priceRange.min}</span>
            <span>${priceRange.max}</span>
          </div>
        </div>
      </div>

      {/* Find the best deal button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleFindDeals}
          disabled={!selectedCategory}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Find the best deal
        </button>
      </div>
    </div>
  );

  // Handle results loading with useEffect for "Myself" flow
  useEffect(() => {
    if (myselfStep === 'results_loading') {
      // Generate random numbers once at the start
      const randomResources = Math.floor(Math.random() * (37 - 19 + 1)) + 19;
      const randomReviews = Math.floor(Math.random() * (9 - 3 + 1)) + 3;
      setRandomNumbers({ resources: randomResources, reviews: randomReviews });

      const steps = [
        { duration: 1333 },
        { duration: 1333 },
        { duration: 1333 },
        { duration: 1333 },
        { duration: 1333 },
        { duration: 1333 },
      ];

      const timers: NodeJS.Timeout[] = [];

      steps.forEach((step, index) => {
        const timer = setTimeout(() => {
          setLoadingStep(index + 1);
        }, step.duration * (index + 1));
        timers.push(timer);
      });

      const finalTimer = setTimeout(async () => {
        // Load products from API
        try {
          const apiProducts = await getProductsByCategory(selectedCategory, budget);
          const transformedProducts = transformProductsForComponent(apiProducts);

          // Sort: First product = highest price (premium), second = cheaper, rest by price desc
          const sorted = [...transformedProducts].sort((a, b) => b.price - a.price);

          setProducts(sorted);
        } catch (error) {
          console.error('Error loading products:', error);
          setProducts([]);
        }
        setMyselfStep('results');
        setLoadingStep(0);
        setVisibleProductCount(1); // Reset to show only first product
      }, 8000);
      timers.push(finalTimer);

      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [myselfStep, selectedCategory, budget]);

  // ALWAYS refresh friends list when entering friend selection - no caching
  useEffect(() => {
    if (personaType === 'friend' && othersStep === 'loading_checking_data') {
      const refreshFriends = async () => {
        console.log('🔄 Refreshing friends list from database...');
        const friends = await getPersonasByType('friend');
        console.log(`✅ Loaded ${friends.length} friends:`, friends.map(f => f.name));
        setFriendsList(friends);
      };
      refreshFriends();
    }
  }, [personaType, othersStep]);

  // Handle loading screens for "Others" flow
  useEffect(() => {
    if (othersStep === 'loading_checking_data') {
      const checkPersona = async () => {
        // For friends, fetch all friends and show selection page
        if (personaType === 'friend') {
          const friends = await getPersonasByType('friend');
          console.log('Fetched friends:', friends);
          setFriendsList(friends);
          setOthersStep('select_friend');
          return;
        }

        // For other personas (mother, father, etc.), check if exists
        const persona = await getPersonaByType(personaType);
        if (persona) {
          setCurrentPersona(persona);
          setOthersStep('loading_found_persona');
          return;
        }

        setOthersStep('loading_no_info');
      };

      const timer = setTimeout(checkPersona, 3500);
      return () => clearTimeout(timer);
    }
  }, [othersStep, personaType]);

  useEffect(() => {
    if (othersStep === 'loading_no_info') {
      const timer = setTimeout(() => {
        setOthersStep('ask_name');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [othersStep]);

  useEffect(() => {
    if (othersStep === 'loading_found_persona') {
      const timer = setTimeout(() => {
        setOthersStep('loading_persona_info');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [othersStep]);

  useEffect(() => {
    if (othersStep === 'loading_persona_info') {
      const timer = setTimeout(() => {
        setOthersStep('loading_preparing');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [othersStep]);

  useEffect(() => {
    if (othersStep === 'loading_preparing') {
      const timer = setTimeout(() => {
        setOthersStep('ask_preferences');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [othersStep]);

  // Handle results loading for "Others" flow
  useEffect(() => {
    if (othersStep === 'results_loading') {
      const randomResources = Math.floor(Math.random() * (37 - 19 + 1)) + 19;
      const randomReviews = Math.floor(Math.random() * (9 - 3 + 1)) + 3;
      setRandomNumbers({ resources: randomResources, reviews: randomReviews });

      const steps = [
        { duration: 1333 },
        { duration: 1333 },
        { duration: 1333 },
        { duration: 1333 },
        { duration: 1333 },
        { duration: 1333 },
      ];

      const timers: NodeJS.Timeout[] = [];

      steps.forEach((step, index) => {
        const timer = setTimeout(() => {
          setLoadingStep(index + 1);
        }, step.duration * (index + 1));
        timers.push(timer);
      });

      const finalTimer = setTimeout(async () => {
        // Load products from API
        try {
          const apiProducts = await getProductsByCategory(othersCategory, othersBudget);
          const transformedProducts = transformProductsForComponent(apiProducts);

          // Sort: First product = highest price (premium), second = cheaper, rest by price desc
          const sorted = [...transformedProducts].sort((a, b) => b.price - a.price);

          setProducts(sorted);
        } catch (error) {
          console.error('Error loading products:', error);
          setProducts([]);
        }
        setOthersStep('results');
        setLoadingStep(0);
        setVisibleProductCount(1);
      }, 8000);
      timers.push(finalTimer);

      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [othersStep, othersCategory, othersBudget]);

  const renderResultsLoading = () => {
    const categoryLabel = CATEGORIES.find(cat => cat.id === selectedCategory)?.label || 'products';

    const steps = [
      { icon: '🔍', text: `Checking ${randomNumbers.resources} resources for ${categoryLabel}` },
      { icon: '⭐', text: `Checking ${randomNumbers.reviews} customer reviews` },
      { icon: '💰', text: 'Finding the best deals' },
      { icon: '📊', text: 'Evaluating product attributes' },
      { icon: '💵', text: 'Comparing prices' },
      { icon: '↩️', text: 'Checking return rates' },
    ];

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/20 animate-ping" />
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/30 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center animate-bounce border-2 border-primary/30" style={{ animationDuration: '1.5s' }}>
            <img src={sourDillLogo} alt="Sweet Dill" className="w-14 h-14 object-contain" />
          </div>
        </div>

        <div className="w-full max-w-md mx-auto space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-center justify-start gap-2.5 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                loadingStep > index ? 'bg-primary text-primary-foreground' : 'border-2 border-muted-foreground/30'
              }`}>
                {loadingStep > index && <Check className="w-4 h-4" />}
              </div>
              <p className={`text-sm transition-colors duration-300 ${
                loadingStep > index ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}>
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const visibleProducts = products.slice(0, visibleProductCount);
    const hasMoreProducts = visibleProductCount < products.length;
    const showListView = visibleProductCount > 2; // Show list after 2nd product

    return (
      <div className="space-y-4 animate-fade-in px-4 py-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            {visibleProductCount === 1 ? 'Premium Deal' : visibleProductCount === 2 ? 'Premium Deals' : 'All Options'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {visibleProductCount === 1
              ? `Showing the top recommendation`
              : visibleProductCount === 2
              ? `Showing top 2 recommendations`
              : `Showing ${Math.min(visibleProductCount, products.length)} of ${products.length} products`}
          </p>
        </div>

        {/* Products - shown one at a time */}
        <div className="space-y-4 max-w-md mx-auto">
          {visibleProducts.map((product, index) => (
            <div key={product.id} className="animate-fade-in">
              {index > 0 && (
                <div className="text-center mb-2">
                  <span className="text-xs font-semibold text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                    {index === 1 ? '2nd Best' : index === 2 ? '3rd Best' : `${index + 1}th Best`}
                  </span>
                </div>
              )}
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-card border border-border/40 rounded-xl p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer hover:border-primary/60 block group active:scale-[0.98]"
              >
                <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-secondary/30 relative">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-base text-foreground mb-2 line-clamp-2">
                  {product.name}
                </h3>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center">
                    <span className="text-2xl font-extrabold text-primary bg-primary/15 px-4 py-2 rounded-lg border border-primary/20">
                      ${product.price}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm text-primary font-semibold">{product.store}</span>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>

        {/* Show Next Product Button */}
        {hasMoreProducts && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleShowNextProduct}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
            >
              {visibleProductCount === 1 ? 'Second Premium Deal' : 'See More Options'}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render "Others" flow screens
  const renderOthersFlow = () => {
    // Step 1: Who to shop for
    if (othersStep === 'who_to_shop_for') {
      return (
        <div className="space-y-6 animate-fade-in px-4 py-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Who are you shopping for?
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for someone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Pill buttons - Friend and Mother */}
          <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
            <button
              onClick={() => {
                setPersonaType('friend');
                setOthersStep('loading_checking_data');
              }}
              className="group flex items-center justify-center p-4 h-16 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
            >
              <span className="font-medium text-center text-sm leading-tight">Friend</span>
            </button>
            <button
              onClick={() => {
                setPersonaType('mother');
                setOthersStep('loading_checking_data');
              }}
              className="group flex items-center justify-center p-4 h-16 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft"
            >
              <span className="font-medium text-center text-sm leading-tight">Mother</span>
            </button>
          </div>

          {/* Searchable options */}
          {searchQuery && (
            <div className="max-w-lg mx-auto space-y-2">
              {['Father', 'Boss', 'Wife', 'Husband', 'Brother', 'Sister', 'Colleague'].filter(option =>
                option.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(option => (
                <button
                  key={option}
                  onClick={() => {
                    setPersonaType(option.toLowerCase());
                    setOthersStep('loading_checking_data');
                    setSearchQuery('');
                  }}
                  className="w-full px-4 py-3 text-left text-sm rounded-lg border border-border/50 bg-card hover:bg-primary/10 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Step 2: Loading - checking data
    if (othersStep === 'loading_checking_data') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/20 animate-ping" />
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/30 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center animate-bounce border-2 border-primary/30" style={{ animationDuration: '1.5s' }}>
              <img src={sourDillLogo} alt="Sweet Dill" className="w-14 h-14 object-contain" />
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground text-center">
            SweetDill Checking historical chat and Personas
          </p>
        </div>
      );
    }

    // Step 3: Loading - no info found
    if (othersStep === 'loading_no_info') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/20 animate-ping" />
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/30 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center animate-bounce border-2 border-primary/30" style={{ animationDuration: '1.5s' }}>
              <img src={sourDillLogo} alt="Sweet Dill" className="w-14 h-14 object-contain" />
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground text-center">
            It seems we do not have info about {personaType}, lets create it
          </p>
        </div>
      );
    }

    // Step 3b: Loading - found persona (for returning users)
    if (othersStep === 'loading_found_persona') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/20 animate-ping" />
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/30 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center animate-bounce border-2 border-primary/30" style={{ animationDuration: '1.5s' }}>
              <img src={sourDillLogo} alt="Sweet Dill" className="w-14 h-14 object-contain" />
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground text-center">
            Hey, Are we going to buy something for {currentPersona?.name}?
          </p>
        </div>
      );
    }

    // Step 3c: Loading - show persona info
    if (othersStep === 'loading_persona_info') {
      const displayInterests = currentPersona?.interests.slice(0, 3).join(', ') || '';
      const lastPurchaseText = currentPersona?.lastPurchase
        ? `Last time we bought ${currentPersona.lastPurchase.item} for ${currentPersona.lastPurchase.occasion}`
        : 'No previous purchases';

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/20 animate-ping" />
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/30 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center animate-bounce border-2 border-primary/30" style={{ animationDuration: '1.5s' }}>
              <img src={sourDillLogo} alt="Sweet Dill" className="w-14 h-14 object-contain" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">
              {currentPersona?.name}, Age {currentPersona?.age}
            </p>
            <p className="text-sm text-muted-foreground">
              Interests: {displayInterests}
            </p>
            <p className="text-sm text-muted-foreground">
              {lastPurchaseText}
            </p>
          </div>
        </div>
      );
    }

    // Step 3.5: Friend Selection Page (only for friends)
    if (othersStep === 'select_friend') {
      // Show first 3 friends by default
      const defaultFriends = friendsList.slice(0, 3);

      // When searching, show matching friends (excluding the default 3 if not searching)
      const searchResults = friendSearchQuery.trim()
        ? friendsList.filter(friend =>
            friend.name.toLowerCase().includes(friendSearchQuery.toLowerCase())
          )
        : [];

      const displayedFriends = friendSearchQuery.trim() ? searchResults : defaultFriends;

      return (
        <div className="space-y-6 animate-fade-in px-4 py-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Select a Friend
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose from your friends or add a new one
            </p>
          </div>

          {/* Show content only if there are friends */}
          {friendsList.length > 0 ? (
            <>
              {/* Default Friends (first 3) */}
              {!friendSearchQuery.trim() && (
                <div className="max-w-lg mx-auto space-y-3">
                  {defaultFriends.map((friend) => (
                    <button
                      key={friend._id}
                      onClick={() => {
                        setCurrentPersona(friend);
                        setPersonaName(friend.name);
                        setPersonaAge(friend.age);
                        setPersonaGender(friend.gender);
                        setPersonaInterests(friend.interests);
                        setOthersStep('loading_found_persona');
                      }}
                      className="w-full p-4 bg-card border border-border/50 rounded-lg hover:border-primary/50 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-lg">{friend.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {friend.age} years old • {friend.gender}
                          </p>
                          {friend.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {friend.interests.slice(0, 3).map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <User className="w-5 h-5 text-muted-foreground ml-3" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Search Bar */}
              <div className="max-w-lg mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    placeholder="Search for other friends..."
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Search Results */}
              {friendSearchQuery.trim() && searchResults.length > 0 && (
                <div className="max-w-lg mx-auto space-y-3">
                  {searchResults.map((friend) => (
                    <button
                      key={friend._id}
                      onClick={() => {
                        setCurrentPersona(friend);
                        setPersonaName(friend.name);
                        setPersonaAge(friend.age);
                        setPersonaGender(friend.gender);
                        setPersonaInterests(friend.interests);
                        setOthersStep('loading_found_persona');
                      }}
                      className="w-full p-4 bg-card border border-border/50 rounded-lg hover:border-primary/50 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-lg">{friend.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {friend.age} years old • {friend.gender}
                          </p>
                          {friend.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {friend.interests.slice(0, 3).map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <User className="w-5 h-5 text-muted-foreground ml-3" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No search results */}
              {friendSearchQuery.trim() && searchResults.length === 0 && (
                <div className="max-w-lg mx-auto text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    No friends found matching "{friendSearchQuery}"
                  </p>
                </div>
              )}

              {/* Add New Friend Button */}
              <div className="max-w-lg mx-auto pt-4">
                <button
                  onClick={() => {
                    setPersonaType('friend');
                    setOthersStep('ask_name');
                  }}
                  className="w-full px-6 py-4 bg-primary/10 text-primary border-2 border-dashed border-primary/30 rounded-lg hover:bg-primary/20 hover:border-primary/50 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Add a New Friend
                </button>
              </div>
            </>
          ) : (
            /* Empty state - No friends yet */
            <div className="max-w-lg mx-auto text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">
                You haven't added any friends yet
              </p>
              <button
                onClick={() => {
                  setPersonaType('friend');
                  setOthersStep('ask_name');
                }}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 font-semibold"
              >
                Add Your First Friend
              </button>
            </div>
          )}
        </div>
      );
    }

    // Step 4: Ask for name
    if (othersStep === 'ask_name') {
      return (
        <div className="space-y-6 animate-fade-in px-4 py-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              What is their name?
            </h2>
          </div>

          <div className="max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Enter name..."
              value={personaName}
              onChange={(e) => setPersonaName(e.target.value)}
              className="w-full px-4 py-3 text-base rounded-lg border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={() => setOthersStep('ask_age')}
              disabled={!personaName.trim()}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    // Step 5: Ask for age (slider 18-120)
    if (othersStep === 'ask_age') {
      const ageRange = `${Math.max(18, personaAge - 2)} to ${Math.min(120, personaAge + 2)}`;
      return (
        <div className="space-y-6 animate-fade-in px-4 py-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              How old is {personaName}?
            </h2>
          </div>

          <div className="max-w-lg mx-auto space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{personaAge}</div>
              <div className="text-sm text-muted-foreground">Age range: {ageRange} years</div>
            </div>

            <Slider
              value={[personaAge]}
              onValueChange={(value) => setPersonaAge(value[0])}
              min={18}
              max={120}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>18</span>
              <span>120</span>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={() => setOthersStep('ask_gender')}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    // Step 6: Ask for gender
    if (othersStep === 'ask_gender') {
      return (
        <div className="space-y-6 animate-fade-in px-4 py-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              What is {personaName}'s gender?
            </h2>
          </div>

          <div className="max-w-lg mx-auto space-y-3">
            {['Male', 'Female', 'Other'].map((gender) => (
              <button
                key={gender}
                onClick={() => {
                  setPersonaGender(gender.toLowerCase());
                  setOthersStep('ask_interests');
                }}
                className="w-full p-4 rounded-xl border border-border/50 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-soft font-medium"
              >
                {gender}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Step 7: Ask for interests/hobbies
    if (othersStep === 'ask_interests') {
      const allInterests = ['Cooking', 'Sport', 'Reading', 'Gaming', 'Music', 'Travel', 'Art', 'Photography', 'Gardening', 'Technology'];
      const mainInterests = ['Cooking', 'Sport'];
      const searchableInterests = allInterests.filter(i => !mainInterests.includes(i));

      return (
        <div className="space-y-6 animate-fade-in px-4 py-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              What are {personaName}'s interests or hobbies?
            </h2>
            <p className="text-sm text-muted-foreground">Select all that apply</p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Main pill buttons */}
          <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
            {mainInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => {
                  setPersonaInterests(prev =>
                    prev.includes(interest)
                      ? prev.filter(i => i !== interest)
                      : [...prev, interest]
                  );
                }}
                className={`p-4 h-16 rounded-xl border transition-all duration-200 font-medium ${
                  personaInterests.includes(interest)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border/50 bg-card hover:bg-primary/10'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>

          {/* Searchable interests */}
          {searchQuery && (
            <div className="max-w-lg mx-auto space-y-2">
              {searchableInterests.filter(interest =>
                interest.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(interest => (
                <button
                  key={interest}
                  onClick={() => {
                    setPersonaInterests(prev =>
                      prev.includes(interest)
                        ? prev.filter(i => i !== interest)
                        : [...prev, interest]
                    );
                    setSearchQuery('');
                  }}
                  className={`w-full px-4 py-3 text-left text-sm rounded-lg border transition-colors ${
                    personaInterests.includes(interest)
                      ? 'bg-primary/10 border-primary'
                      : 'border-border/50 bg-card hover:bg-primary/10'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          )}

          {/* Selected interests */}
          {personaInterests.length > 0 && (
            <div className="max-w-lg mx-auto">
              <p className="text-sm text-muted-foreground mb-2">Selected:</p>
              <div className="flex flex-wrap gap-2">
                {personaInterests.map(interest => (
                  <span key={interest} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button
              onClick={async () => {
                // Save persona to database
                const savedPersona = await savePersona({
                  type: personaType,
                  name: personaName,
                  age: personaAge,
                  gender: personaGender,
                  interests: personaInterests,
                });

                if (savedPersona) {
                  setCurrentPersona(savedPersona);
                }

                setOthersStep('loading_preparing');
              }}
              disabled={personaInterests.length === 0}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    // Step 7b: Loading - preparing
    if (othersStep === 'loading_preparing') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/20 animate-ping" />
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/30 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center animate-bounce border-2 border-primary/30" style={{ animationDuration: '1.5s' }}>
              <img src={sourDillLogo} alt="Sweet Dill" className="w-14 h-14 object-contain" />
            </div>
          </div>
          <p className="text-lg font-semibold text-foreground text-center">
            SweetDill AI is preparing the chat
          </p>
        </div>
      );
    }

    // Step 8: Ask for preferences (category + occasion + budget on one page)
    if (othersStep === 'ask_preferences') {
      // For mother persona, show 4 specific categories as pills
      const motherCategories = [
        { id: 'jewellery', label: 'Jewellery', icon: Gem },
        { id: 'grills', label: 'Grill', icon: Flame },
        { id: 'facemasks', label: 'Skin Mask', icon: Sparkles },
        { id: 'clothing', label: 'Clothing', icon: Shirt },
      ];

      const isMother = personaType === 'mother' || currentPersona?.type === 'mother';
      const allOccasions = ['Birthday', 'Just Because', 'Anniversary', 'Wedding', 'Graduation', 'Christmas', 'Valentines Day', 'Mothers Day', 'Fathers Day'];
      const mainOccasions = ['Birthday', 'Just Because'];

      return (
        <div className="space-y-4 animate-fade-in px-4 py-6">
          {/* Category Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Category</h3>

            {/* Selected Category Display */}
            {othersCategory && (
              <div className="max-w-lg mx-auto">
                <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                  {(() => {
                    const selectedCat = CATEGORIES.find(cat => cat.id === othersCategory);
                    const Icon = selectedCat?.icon || Gem;
                    return (
                      <>
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-primary flex-1">
                          {selectedCat?.label || othersCategory}
                        </span>
                        <button
                          onClick={() => {
                            setOthersCategory('');
                            setPriceRange({ min: 50, max: 1000 });
                            setOthersBudget(500);
                          }}
                          className="text-primary hover:text-primary/70 text-xs"
                        >
                          Change
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Category search bar */}
            {!othersCategory && (
              <div className="relative max-w-lg mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}

            {/* Category pills for mother */}
            {!othersCategory && isMother && !categorySearchQuery && (
              <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
                {motherCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={async () => {
                        setOthersCategory(category.id);
                        // Fetch price range for this category
                        const range = await getCategoryPriceRange(category.id);
                        setPriceRange({ min: range.minPrice, max: range.maxPrice });
                        setOthersBudget(Math.min(500, range.maxPrice));
                      }}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg border transition-all duration-200 border-border/50 bg-card hover:border-primary/50 hover:shadow-sm"
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium text-center">{category.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Category grid for non-mother or when searching */}
            {!othersCategory && (!isMother || categorySearchQuery) && (
              <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
                {filteredCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={async () => {
                        setOthersCategory(category.id);
                        setCategorySearchQuery('');
                        // Fetch price range for this category
                        const range = await getCategoryPriceRange(category.id);
                        setPriceRange({ min: range.minPrice, max: range.maxPrice });
                        setOthersBudget(Math.min(500, range.maxPrice));
                      }}
                      className="flex flex-col items-center gap-1 p-3 rounded-lg border transition-all duration-200 border-border/50 bg-card hover:border-primary/50 hover:shadow-sm"
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium text-center">{category.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Occasion Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Occasion</h3>

            {/* Selected Occasion Display */}
            {othersOccasion && (
              <div className="max-w-lg mx-auto">
                <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                  <span className="text-sm font-medium text-primary flex-1">
                    {othersOccasion}
                  </span>
                  <button
                    onClick={() => setOthersOccasion('')}
                    className="text-primary hover:text-primary/70 text-xs"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {/* Occasion search bar */}
            {!othersOccasion && (
              <div className="relative max-w-lg mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search occasions..."
                  value={occasionSearchQuery}
                  onChange={(e) => setOccasionSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}

            {/* Main occasion pills - only show when not searching */}
            {!othersOccasion && !occasionSearchQuery && (
              <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
                {mainOccasions.map((occasion) => (
                  <button
                    key={occasion}
                    onClick={() => setOthersOccasion(occasion)}
                    className="p-3 h-12 rounded-lg border transition-all duration-200 font-medium text-sm border-border/50 bg-card hover:bg-primary/10"
                  >
                    {occasion}
                  </button>
                ))}
              </div>
            )}

            {/* Searchable occasions - show when searching */}
            {!othersOccasion && occasionSearchQuery && (
              <div className="max-w-lg mx-auto space-y-2">
                {allOccasions.filter(occasion =>
                  occasion.toLowerCase().includes(occasionSearchQuery.toLowerCase())
                ).map(occasion => (
                  <button
                    key={occasion}
                    onClick={() => {
                      setOthersOccasion(occasion);
                      setOccasionSearchQuery('');
                    }}
                    className="w-full px-4 py-2 text-left text-sm rounded-lg border border-border/50 bg-card hover:bg-primary/10 transition-colors"
                  >
                    {occasion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Budget Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Budget</h3>
            <div className="max-w-lg mx-auto space-y-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">${othersBudget}</div>
              </div>
              <Slider
                value={[othersBudget]}
                onValueChange={(value) => setOthersBudget(value[0])}
                min={priceRange.min}
                max={priceRange.max}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>${priceRange.min}</span>
                <span>${priceRange.max}</span>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setOthersStep('results_loading')}
              disabled={!othersCategory || !othersOccasion}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Find Gifts
            </button>
          </div>
        </div>
      );
    }

    // Step 11: Results loading (same as Myself flow)
    if (othersStep === 'results_loading') {
      return renderResultsLoading();
    }

    // Step 12: Results (same as Myself flow)
    if (othersStep === 'results') {
      return renderResults();
    }

    return null;
  };

  const renderContent = () => {
    // Entry point selection
    if (!selectedEntryPoint) {
      return <EntryPointScreen entryPoints={entryPoints} onSelect={handleEntryPointSelect} />;
    }

    // "Myself" flow
    if (selectedEntryPoint === 'myself') {
      if (myselfStep === 'initial_loading') return renderInitialLoading();
      if (myselfStep === 'category_budget') return renderCategoryBudget();
      if (myselfStep === 'results_loading') return renderResultsLoading();
      if (myselfStep === 'results') return renderResults();
    }

    // "Others" flow
    if (selectedEntryPoint === 'others') {
      return renderOthersFlow();
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <button
          onClick={!selectedEntryPoint ? onBack : handleReset}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {!selectedEntryPoint ? 'Back' : 'Reset'}
        </button>
        <h1 className="text-sm font-semibold text-foreground">Browse & Select</h1>

        {/* Show "Start Over" button on results screen */}
        {((selectedEntryPoint === 'myself' && myselfStep === 'results') ||
          (selectedEntryPoint === 'others' && othersStep === 'results')) && (
          <button
            onClick={() => {
              // Reset to the very beginning
              if (selectedEntryPoint === 'myself') {
                // Reset to entry point selection
                setSelectedEntryPoint('');
                setMyselfStep('entry');
                setSelectedCategory('');
                setBudget(500);
                setSearchQuery('');
                setCategorySearchQuery('');
                setProducts([]);
                setVisibleProductCount(1);
              } else {
                // Reset to "Who to shop for?" selection
                setOthersStep('who_to_shop_for');
                setPersonaType('');
                setPersonaName('');
                setPersonaAge(50);
                setPersonaGender('');
                setPersonaInterests([]);
                setOthersCategory('');
                setOthersOccasion('');
                setOthersBudget(500);
                setCategorySearchQuery('');
                setOccasionSearchQuery('');
                setCurrentPersona(null);
                setFriendsList([]);
                setFriendSearchQuery('');
                setProducts([]);
                setVisibleProductCount(1);
              }
            }}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start Over
          </button>
        )}

        {/* Spacer for alignment */}
        {!((selectedEntryPoint === 'myself' && myselfStep === 'results') ||
            (selectedEntryPoint === 'others' && othersStep === 'results')) && (
          <div className="w-16" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto min-h-full flex items-center justify-center">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

