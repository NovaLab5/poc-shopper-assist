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
    name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    brand: 'Sony',
    price: 349.99,
    originalPrice: 399.99,
    image: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=500',
    category: 'Audio',
    rating: 4.7,
    reviewCount: 23874,
    description:
      'Flagship over-ear headphones with adaptive noise cancellation, rich detail, and up to 30 hours of battery life.',
    features: [
      'Adaptive noise cancellation with auto wind reduction',
      '30-hour battery with fast charge',
      'Crystal-clear beamforming microphones',
      'Multipoint Bluetooth pairing',
      'Soft-fit leather for long sessions'
    ],
    priceHistory: generatePriceHistory(349.99, 0.12),
    inStock: true,
    storeLink: 'https://amazon.com'
  },
  {
    id: 'prod-002',
    name: 'Apple AirPods Pro (2nd Gen, USB-C)',
    brand: 'Apple',
    price: 249.99,
    originalPrice: 249.99,
    image: 'https://images.unsplash.com/photo-1585386959984-a41552231693?w=500',
    category: 'Audio',
    rating: 4.6,
    reviewCount: 40211,
    description:
      'In-ear earbuds with adaptive transparency, personalized spatial audio, and a USB-C charging case.',
    features: [
      'Active Noise Cancellation + Adaptive Transparency',
      'Personalized Spatial Audio with dynamic head tracking',
      'Up to 6 hours of listening time',
      'USB-C MagSafe charging case',
      'IP54 dust, sweat, and water resistance'
    ],
    priceHistory: generatePriceHistory(249.99, 0.08),
    inStock: true,
    storeLink: 'https://apple.com'
  },
  {
    id: 'prod-003',
    name: 'Google Nest Hub (2nd Gen)',
    brand: 'Google',
    price: 99.99,
    originalPrice: 109.99,
    image: 'https://images.unsplash.com/photo-1512446733611-9099a758e593?w=500',
    category: 'Smart Home',
    rating: 4.4,
    reviewCount: 15432,
    description:
      '7-inch smart display that manages your home, plays media, and offers gentle sleep insights.',
    features: [
      '7-inch display with ambient EQ',
      'Sleep sensing insights (compatible accounts)',
      'Google Assistant voice control',
      'Smart home dashboard',
      'Speaker tuned for room-filling sound'
    ],
    priceHistory: generatePriceHistory(99.99, 0.15),
    inStock: true,
    storeLink: 'https://store.google.com'
  },
  {
    id: 'prod-004',
    name: 'Amazon Echo Show 8 (3rd Gen)',
    brand: 'Amazon',
    price: 149.99,
    originalPrice: 169.99,
    image: 'https://images.unsplash.com/photo-1518441983756-8a1621f5a8b8?w=500',
    category: 'Smart Home',
    rating: 4.5,
    reviewCount: 19752,
    description:
      'Smart display with spatial audio, a crisp 8-inch screen, and built-in smart home hub.',
    features: [
      '8-inch HD touch display',
      'Spatial audio with adaptive room tuning',
      'Built-in smart home hub',
      '13 MP camera with auto-framing',
      'Works with Alexa routines'
    ],
    priceHistory: generatePriceHistory(149.99, 0.14),
    inStock: true,
    storeLink: 'https://amazon.com'
  },
  {
    id: 'prod-005',
    name: 'Logitech MX Master 3S Wireless Mouse',
    brand: 'Logitech',
    price: 99.99,
    originalPrice: 119.99,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500',
    category: 'Tech Gadgets',
    rating: 4.7,
    reviewCount: 28650,
    description:
      'Ergonomic productivity mouse with ultra-quiet clicks and precision tracking on any surface.',
    features: [
      'MagSpeed electromagnetic scrolling',
      '8K DPI tracking on glass',
      'Quiet clicks for focused work',
      'USB-C fast charging',
      'Pair with up to 3 devices'
    ],
    priceHistory: generatePriceHistory(99.99, 0.1),
    inStock: true,
    storeLink: 'https://logitech.com'
  }
];

// Helper function to get product by category
export function getProductsByCategory(category: string): Product[] {
  return mockProducts.filter(p => p.category === category);
}

// Helper function to get a single product
export function getProductById(id: string): Product | undefined {
  // Handle both 'prod-001' format and numeric '1' format
  const product = mockProducts.find(p => p.id === id);
  if (product) return product;
  
  // Try numeric lookup (1 -> prod-001)
  const numericId = parseInt(id, 10);
  if (!isNaN(numericId) && numericId > 0) {
    const paddedId = `prod-${String(numericId).padStart(3, '0')}`;
    return mockProducts.find(p => p.id === paddedId);
  }
  
  return undefined;
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
