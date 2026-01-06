import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Use the MONGODB_URI from .env (works inside Docker)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:sweetdill123@mongodb:27017/sweetdill?authSource=admin';

const products = [
  // Grills (from products.ts)
  {
    id: 'grill-weber-genesis',
    name: 'Weber Genesis S-435 Gas Grill',
    brand: 'Weber',
    category: 'grills',
    tags: ['premium', 'propane', 'gas', 'high-end', 'quality', 'popular'],
    price: 1299,
    amazonUrl: 'https://www.amazon.com/dp/B0CPGW4RTG',
    imageUrl: 'https://m.media-amazon.com/images/I/71vJXMj5jnL._AC_SL1500_.jpg',
    rating: 4.9,
    store: 'Amazon',
  },
  {
    id: 'grill-ninja-flexflame',
    name: 'Ninja FlexFlame Electric & Propane Grill',
    brand: 'Ninja',
    category: 'grills',
    tags: ['electric', 'propane', 'combo', 'modern', 'versatile', 'convenient'],
    price: 399,
    amazonUrl: 'https://www.amazon.com/dp/B0DKXQXQXQ',
    imageUrl: 'https://m.media-amazon.com/images/I/71rVq8qH7SL._AC_SL1500_.jpg',
    rating: 4.7,
    store: 'Amazon',
  },
  {
    id: 'grill-weber-spirit',
    name: 'Weber SPIRIT 4-Burner EP-425 Propane Grill',
    brand: 'Weber',
    category: 'grills',
    tags: ['mid-range', 'propane', 'value', 'reliable', '4-burner'],
    price: 699,
    amazonUrl: 'https://www.amazon.com/Weber-SPIRIT-4-Burner-EP-425-Propane/dp/B0DPH5H1TF',
    imageUrl: 'https://m.media-amazon.com/images/I/71LJJrKbezL._AC_SL1500_.jpg',
    rating: 4.8,
    store: 'Amazon',
  },
  {
    id: 'grill-charbroil-amplifire',
    name: 'Char-Broil Amplifire Infrared Grill',
    brand: 'Char-Broil',
    category: 'grills',
    tags: ['infrared', 'searing', 'griddle', 'versatile', 'power', 'performance'],
    price: 549,
    amazonUrl: 'https://www.amazon.com/Char-Broil%C2%AE-AmplifireTM-Infrared-Technology-463365124/dp/B0CSPNHDMP',
    imageUrl: 'https://m.media-amazon.com/images/I/71jxwZwZ9rL._AC_SL1500_.jpg',
    rating: 4.6,
    store: 'Amazon',
  },
  {
    id: 'g1',
    name: 'Sophia & William Charcoal and Propane Gas Grill Combo with Side Burner',
    brand: 'Sophia & William',
    category: 'grills',
    tags: ['charcoal', 'propane', 'combo', 'side-burner', 'versatile'],
    price: 399,
    amazonUrl: 'https://www.amazon.com/Sophia-William-Charcoal-Porcelain-Enameled-Barbecue/dp/B0CMTPLBDJ',
    imageUrl: 'https://m.media-amazon.com/images/I/71YOI2rZ3-L._AC_SL1500_.jpg',
    rating: 4.8,
    store: 'Amazon',
  },
  {
    id: 'g2',
    name: 'Sophia & William Extra Large Charcoal BBQ Grills with 794 SQ.IN. Cooking Area',
    brand: 'Sophia & William',
    category: 'grills',
    tags: ['charcoal', 'large', 'bbq', 'outdoor', 'cooking'],
    price: 299,
    amazonUrl: 'https://www.amazon.com/Sophia-William-Heavy-duty-Individual-Adjustable/dp/B0B4CB6W9R',
    imageUrl: 'https://m.media-amazon.com/images/I/71ZGUHxllJL._AC_SL1500_.jpg',
    rating: 4.6,
    store: 'Amazon',
  },

  // Skechers (from products.ts)
  {
    id: 'skechers-gowalk',
    name: 'Skechers Go Walk 6 - Harmonious',
    brand: 'Skechers',
    category: 'skechers',
    tags: ['walking', 'travel', 'lightweight', 'breathable', 'comfort', 'popular'],
    price: 75,
    amazonUrl: 'https://www.amazon.com/dp/B08QZRD2JM',
    imageUrl: 'https://m.media-amazon.com/images/I/71Wa3oPxgyL._AC_SL1500_.jpg',
    rating: 4.7,
    store: 'Amazon',
  },
  {
    id: 'skechers-slip-ins',
    name: 'Skechers Slip-ins Max Cushioning',
    brand: 'Skechers',
    category: 'skechers',
    tags: ['slip-on', 'easy', 'cushioning', 'convenient', 'hands-free'],
    price: 89,
    amazonUrl: 'https://www.amazon.com/dp/B0B9BN7YQT',
    imageUrl: 'https://m.media-amazon.com/images/I/71nHmyK1URL._AC_SL1500_.jpg',
    rating: 4.6,
    store: 'Amazon',
  },
  {
    id: 'skechers-arch-fit',
    name: 'Skechers Arch Fit - Banlin',
    brand: 'Skechers',
    category: 'skechers',
    tags: ['arch-support', 'work', 'standing', 'supportive', 'comfort', 'all-day'],
    price: 95,
    amazonUrl: 'https://www.amazon.com/dp/B08Q3FWYSH',
    imageUrl: 'https://m.media-amazon.com/images/I/71T+iwSGhzL._AC_SL1500_.jpg',
    rating: 4.8,
    store: 'Amazon',
  },

  // Watches (from BrowseSelectInterface)
  {
    id: 'w1',
    name: 'Apple Watch Series 11 GPS 46mm',
    brand: 'Apple',
    category: 'watches',
    tags: ['smartwatch', 'gps', 'fitness', 'health', 'premium'],
    price: 429,
    amazonUrl: 'https://www.amazon.com/Apple-Watch-Smartwatch-Aluminum-Always/dp/B0FQF5BZ8Z',
    imageUrl: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&h=800&fit=crop',
    rating: 4.9,
    store: 'Amazon',
  },
  {
    id: 'w2',
    name: 'Apple Watch Series 11 GPS + Cellular 46mm',
    brand: 'Apple',
    category: 'watches',
    tags: ['smartwatch', 'gps', 'cellular', 'fitness', 'health', 'premium'],
    price: 529,
    amazonUrl: 'https://www.amazon.com/Apple-Watch-Smartwatch-Aluminum-Always/dp/B0FQF9S6MH',
    imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&h=800&fit=crop',
    rating: 4.8,
    store: 'Amazon',
  },
  {
    id: 'w3',
    name: 'Apple Watch SE (2nd Gen) 44mm',
    brand: 'Apple',
    category: 'watches',
    tags: ['smartwatch', 'gps', 'fitness', 'budget', 'value'],
    price: 249,
    amazonUrl: 'https://www.amazon.com/s?k=apple+watch+se+2nd+gen',
    imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop',
    rating: 4.7,
    store: 'Amazon',
  },
  {
    id: 'w4',
    name: 'Apple Watch Series 9 GPS 45mm',
    brand: 'Apple',
    category: 'watches',
    tags: ['smartwatch', 'gps', 'fitness', 'health'],
    price: 349,
    amazonUrl: 'https://www.walmart.com/search?q=apple+watch+series+9',
    imageUrl: 'https://images.unsplash.com/photo-1510017803434-a899398421b3?w=800&h=800&fit=crop',
    rating: 4.8,
    store: 'Walmart',
  },

  // Face Masks (from BrowseSelectInterface)
  {
    id: 'fm1',
    name: 'Mettler1929 Anti-Aging Face Mask - Vegan Collagen Boost',
    brand: 'Mettler1929',
    category: 'facemasks',
    tags: ['anti-aging', 'vegan', 'collagen', 'skincare', 'premium'],
    price: 249,
    amazonUrl: 'https://www.amazon.com/Mettler1929-Anti-Aging-proactively-against-%E2%94%82vegan/dp/B089GPG8NF',
    imageUrl: 'https://m.media-amazon.com/images/I/61lnkRWzLrL._SL1500_.jpg',
    rating: 4.7,
    store: 'Amazon',
  },
  {
    id: 'fm2',
    name: 'Jan Marini Hyla3D Face Mask - Professional Grade Hydration',
    brand: 'Jan Marini',
    category: 'facemasks',
    tags: ['hydration', 'professional', 'skincare', 'premium'],
    price: 100,
    amazonUrl: 'https://www.amazon.com/Jan-Marini-Hyla3D-Face-Mask/dp/B0CKZH3RCL',
    imageUrl: 'https://m.media-amazon.com/images/I/51uz0h+XeUL._SL1200_.jpg',
    rating: 4.6,
    store: 'Amazon',
  },

  // Jewellery (from BrowseSelectInterface)
  {
    id: 'j1',
    name: 'Diamond Necklace',
    brand: 'Generic',
    category: 'jewellery',
    tags: ['diamond', 'necklace', 'jewelry', 'gift', 'elegant'],
    price: 299,
    amazonUrl: 'https://www.amazon.com/s?k=diamond+necklace',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop',
    rating: 4.8,
    store: 'Amazon',
  },
  {
    id: 'j2',
    name: 'Gold Bracelet',
    brand: 'Generic',
    category: 'jewellery',
    tags: ['gold', 'bracelet', 'jewelry', 'gift', 'elegant'],
    price: 199,
    amazonUrl: 'https://www.amazon.com/s?k=gold+bracelet',
    imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=800&fit=crop',
    rating: 4.7,
    store: 'Amazon',
  },

  // Clothing (from BrowseSelectInterface)
  {
    id: 'c1',
    name: 'Cashmere Sweater',
    brand: 'Generic',
    category: 'clothing',
    tags: ['cashmere', 'sweater', 'luxury', 'warm', 'gift'],
    price: 149,
    amazonUrl: 'https://www.amazon.com/s?k=cashmere+sweater',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop',
    rating: 4.6,
    store: 'Amazon',
  },
  {
    id: 'c2',
    name: 'Silk Scarf',
    brand: 'Generic',
    category: 'clothing',
    tags: ['silk', 'scarf', 'luxury', 'accessory', 'gift'],
    price: 79,
    amazonUrl: 'https://www.amazon.com/s?k=silk+scarf',
    imageUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&h=800&fit=crop',
    rating: 4.5,
    store: 'Amazon',
  },
];

async function seedProducts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Clearing existing products...');
    await Product.deleteMany({});
    console.log('Existing products cleared');

    console.log('Seeding products...');
    await Product.insertMany(products);
    console.log(`Successfully seeded ${products.length} products`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();

