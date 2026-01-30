export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  description: string;
  features: string[];
  priceHistory: PriceHistoryPoint[];
  inStock: boolean;
  storeLink: string;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export type ProductTier = 'best' | 'budget' | 'upgrade';

export interface ProductRecommendation {
  tier: ProductTier;
  product: Product;
  reason: string;
}

// Mock price history generator (90 days)
function generatePriceHistory(currentPrice: number, variance: number = 0.15): PriceHistoryPoint[] {
  const history: PriceHistoryPoint[] = [];
  const days = 90;
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate realistic price fluctuation
    const randomVariation = (Math.random() - 0.5) * variance;
    const price = currentPrice * (1 + randomVariation);
    
    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100
    });
  }
  
  return history;
}

export const mockProducts: Product[] = [
  {
    id: 'prod-001',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    brand: 'Sony',
    price: 349.99,
    originalPrice: 399.99,
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500',
    category: 'Electronics',
    rating: 4.8,
    reviewCount: 12453,
    description: 'Industry-leading noise cancellation with exceptional sound quality and 30-hour battery life.',
    features: [
      'Industry-leading noise cancellation',
      '30-hour battery life',
      'Multi-point connection',
      'Premium comfort design',
      'Quick charging (3 min = 3 hours)'
    ],
    priceHistory: generatePriceHistory(349.99, 0.12),
    inStock: true,
    storeLink: 'https://amazon.com'
  },
  {
    id: 'prod-002',
    name: 'Anker Soundcore Q30 Wireless Headphones',
    brand: 'Anker',
    price: 79.99,
    originalPrice: 99.99,
    image: 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=500',
    category: 'Electronics',
    rating: 4.5,
    reviewCount: 8932,
    description: 'Affordable noise-cancelling headphones with impressive 40-hour battery life.',
    features: [
      'Active noise cancellation',
      '40-hour battery life',
      'BassUp technology',
      'Comfortable earpads',
      'App customization'
    ],
    priceHistory: generatePriceHistory(79.99, 0.10),
    inStock: true,
    storeLink: 'https://amazon.com'
  },
  {
    id: 'prod-003',
    name: 'Bose QuietComfort Ultra Wireless Headphones',
    brand: 'Bose',
    price: 429.00,
    originalPrice: 449.00,
    image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500',
    category: 'Electronics',
    rating: 4.9,
    reviewCount: 5621,
    description: 'Premium spatial audio experience with world-class noise cancellation.',
    features: [
      'Immersive spatial audio',
      'World-class noise cancellation',
      '24-hour battery life',
      'CustomTune technology',
      'Premium materials'
    ],
    priceHistory: generatePriceHistory(429.00, 0.08),
    inStock: true,
    storeLink: 'https://amazon.com'
  },
  {
    id: 'prod-004',
    name: 'Patagonia Better Sweater Fleece Jacket',
    brand: 'Patagonia',
    price: 139.00,
    originalPrice: 159.00,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500',
    category: 'Apparel',
    rating: 4.7,
    reviewCount: 3421,
    description: 'Classic fleece jacket made from recycled polyester with a cozy sweater-knit exterior.',
    features: [
      'Made from recycled polyester',
      'Sweater-knit exterior',
      'Full-zip design',
      'Zippered handwarmer pockets',
      'Fair Trade Certified sewn'
    ],
    priceHistory: generatePriceHistory(139.00, 0.15),
    inStock: true,
    storeLink: 'https://patagonia.com'
  },
  {
    id: 'prod-005',
    name: 'Ninja Creami Ice Cream Maker',
    brand: 'Ninja',
    price: 179.99,
    originalPrice: 229.99,
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500',
    category: 'Home & Kitchen',
    rating: 4.6,
    reviewCount: 7834,
    description: 'Turn almost anything into ice cream, sorbet, gelato, and more.',
    features: [
      '7 one-touch programs',
      'Create custom frozen treats',
      'Mix-in functionality',
      'Easy to clean',
      'Includes 3 pint containers'
    ],
    priceHistory: generatePriceHistory(179.99, 0.18),
    inStock: true,
    storeLink: 'https://amazon.com'
  }
];

// Helper function to get product by category
export function getProductsByCategory(category: string): Product[] {
  return mockProducts.filter(p => p.category === category);
}

// Helper function to get a single product
export function getProductById(id: string): Product | undefined {
  return mockProducts.find(p => p.id === id);
}

// Calculate price trend (for alerts/badges)
export function getPriceTrend(product: Product): {
  direction: 'up' | 'down' | 'stable';
  percentChange: number;
} {
  const history = product.priceHistory;
  if (history.length < 2) return { direction: 'stable', percentChange: 0 };
  
  const oldPrice = history[0].price;
  const currentPrice = history[history.length - 1].price;
  const percentChange = ((currentPrice - oldPrice) / oldPrice) * 100;
  
  if (percentChange > 2) return { direction: 'up', percentChange };
  if (percentChange < -2) return { direction: 'down', percentChange };
  return { direction: 'stable', percentChange };
}

// Get min/max/avg prices for graph
export function getPriceStats(product: Product) {
  const prices = product.priceHistory.map(p => p.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: prices.reduce((a, b) => a + b, 0) / prices.length,
    current: prices[prices.length - 1]
  };
}
