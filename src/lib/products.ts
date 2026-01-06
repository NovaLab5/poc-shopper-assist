import { Product } from './types';

export const products: Product[] = [
  // Grills
  {
    id: 'grill-weber-genesis',
    name: 'Weber Genesis S-435 Gas Grill',
    brand: 'Weber',
    category: 'Grill',
    tags: ['premium', 'propane', 'gas', 'high-end', 'quality', 'popular'],
    price: 1299,
    amazonUrl: 'https://www.amazon.com/dp/B0CPGW4RTG',
    imageUrl: 'https://m.media-amazon.com/images/I/71vJXMj5jnL._AC_SL1500_.jpg',
  },
  {
    id: 'grill-ninja-flexflame',
    name: 'Ninja FlexFlame Electric & Propane Grill',
    brand: 'Ninja',
    category: 'Grill',
    tags: ['electric', 'propane', 'combo', 'modern', 'versatile', 'convenient'],
    price: 399,
    amazonUrl: 'https://www.amazon.com/dp/B0DKXQXQXQ',
    imageUrl: 'https://m.media-amazon.com/images/I/71rVq8qH7SL._AC_SL1500_.jpg',
  },
  {
    id: 'grill-weber-spirit',
    name: 'Weber SPIRIT 4-Burner EP-425 Propane Grill',
    brand: 'Weber',
    category: 'Grill',
    tags: ['mid-range', 'propane', 'value', 'reliable', '4-burner'],
    price: 699,
    amazonUrl: 'https://www.amazon.com/Weber-SPIRIT-4-Burner-EP-425-Propane/dp/B0DPH5H1TF',
    imageUrl: 'https://m.media-amazon.com/images/I/71LJJrKbezL._AC_SL1500_.jpg',
  },
  {
    id: 'grill-charbroil-amplifire',
    name: 'Char-Broil Amplifire Infrared Grill',
    brand: 'Char-Broil',
    category: 'Grill',
    tags: ['infrared', 'searing', 'griddle', 'versatile', 'power', 'performance'],
    price: 549,
    amazonUrl: 'https://www.amazon.com/Char-Broil%C2%AE-AmplifireTM-Infrared-Technology-463365124/dp/B0CSPNHDMP',
    imageUrl: 'https://m.media-amazon.com/images/I/71jxwZwZ9rL._AC_SL1500_.jpg',
  },

  // Skechers
  {
    id: 'skechers-gowalk',
    name: 'Skechers Go Walk 6 - Harmonious',
    brand: 'Skechers',
    category: 'Skechers',
    tags: ['walking', 'travel', 'lightweight', 'breathable', 'comfort', 'popular'],
    price: 75,
    amazonUrl: 'https://www.amazon.com/dp/B08QZRD2JM',
    imageUrl: 'https://m.media-amazon.com/images/I/71Wa3oPxgyL._AC_SL1500_.jpg',
  },
  {
    id: 'skechers-slip-ins',
    name: 'Skechers Slip-ins Max Cushioning',
    brand: 'Skechers',
    category: 'Skechers',
    tags: ['slip-on', 'easy', 'cushioning', 'convenient', 'hands-free'],
    price: 89,
    amazonUrl: 'https://www.amazon.com/dp/B0B9BN7YQT',
    imageUrl: 'https://m.media-amazon.com/images/I/71nHmyK1URL._AC_SL1500_.jpg',
  },
  {
    id: 'skechers-arch-fit',
    name: 'Skechers Arch Fit - Banlin',
    brand: 'Skechers',
    category: 'Skechers',
    tags: ['arch-support', 'work', 'standing', 'supportive', 'comfort', 'all-day'],
    price: 95,
    amazonUrl: 'https://www.amazon.com/dp/B08Q3FWYSH',
    imageUrl: 'https://m.media-amazon.com/images/I/71T+iwSGhzL._AC_SL1500_.jpg',
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

export function getProductsByIds(ids: string[]): Product[] {
  return ids.map(id => getProductById(id)).filter(Boolean) as Product[];
}
