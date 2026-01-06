import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:sweetdill123@mongodb:27017/sweetdill?authSource=admin';
const SOURCE_URI = 'mongodb://temp-mongo:27017/wirecutter_products';

interface WirecutterProduct {
  _id: any;
  product_name: string;
  retailer: string;
  affiliate_url: string;
  direct_url: string;
  price: string;
  review_url: string;
  scraped_at: Date;
  category: string;
  brand: string;
  description: string;
  image_url: string;
  in_stock: boolean | null;
  model: string;
}

/**
 * Parse price string to number
 */
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove currency symbols and commas, extract first number
  const match = priceStr.match(/[\d,]+\.?\d*/);
  if (match) {
    return parseFloat(match[0].replace(/,/g, ''));
  }
  return 0;
}

/**
 * Generate category slug from category name
 */
function generateCategorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate unique product ID
 */
function generateProductId(product: WirecutterProduct, index: number): string {
  const brandSlug = product.brand?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'unknown';
  const modelSlug = product.model?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `product-${index}`;
  return `${brandSlug}-${modelSlug}`.substring(0, 100);
}

/**
 * Extract tags from category and brand
 */
function generateTags(product: WirecutterProduct): string[] {
  const tags: string[] = [];
  
  if (product.brand) tags.push(product.brand.toLowerCase());
  if (product.category) {
    // Add category words as tags
    const categoryWords = product.category.toLowerCase().split(/\s+/);
    tags.push(...categoryWords.filter(word => word.length > 3));
  }
  if (product.retailer) tags.push(product.retailer.toLowerCase());
  
  return [...new Set(tags)]; // Remove duplicates
}

async function migrateProducts() {
  let sourceConn: typeof mongoose | null = null;
  let targetConn: typeof mongoose | null = null;

  try {
    console.log('Connecting to source database (wirecutter_products)...');
    sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
    console.log('Connected to source database');

    console.log('Connecting to target database (sweetdill)...');
    targetConn = await mongoose.connect(MONGODB_URI);
    console.log('Connected to target database');

    // Get source collection
    const WirecutterProductModel = sourceConn.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
    
    console.log('Fetching products from wirecutter_products...');
    const wirecutterProducts = await WirecutterProductModel.find({}).lean() as WirecutterProduct[];
    console.log(`Found ${wirecutterProducts.length} products`);

    console.log('Transforming products...');
    const productsToImport = [];
    let skipped = 0;

    for (let i = 0; i < wirecutterProducts.length; i++) {
      const wp = wirecutterProducts[i];

      const price = parsePrice(wp.price);
      if (price === 0 || price > 10000) {
        skipped++;
        continue; // Skip products with no valid price or unreasonably high price
      }

      const productId = generateProductId(wp, i);

      productsToImport.push({
        id: productId,
        name: wp.product_name || wp.model || 'Unknown Product',
        brand: wp.brand || wp.retailer || 'Unknown',
        category: generateCategorySlug(wp.category || 'general'),
        tags: generateTags(wp),
        price: price,
        amazonUrl: wp.affiliate_url || wp.direct_url || '',
        imageUrl: wp.image_url || '',
        rating: 4.5, // Default rating
        store: wp.retailer || 'Amazon',
      });
    }

    console.log(`Transformed ${productsToImport.length} products (skipped ${skipped})`);
    console.log('Bulk importing products...');

    // Use insertMany with ordered: false to continue on duplicates
    const result = await Product.insertMany(productsToImport, {
      ordered: false,
      rawResult: true
    }).catch((error: any) => {
      // Handle duplicate key errors
      if (error.code === 11000) {
        return { insertedCount: error.result?.nInserted || 0 };
      }
      throw error;
    });

    const imported = result.insertedCount || productsToImport.length;

    console.log(`\nMigration complete!`);
    console.log(`Imported: ${imported} products`);
    console.log(`Skipped: ${skipped} products`);

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    if (sourceConn) await sourceConn.close();
    if (targetConn) await mongoose.connection.close();
  }
}

migrateProducts();

