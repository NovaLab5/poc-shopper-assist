import mongoose from 'mongoose';
import Product from '../src/models/Product';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:sweetdill123@localhost:27017/sweetdill?authSource=admin';

/**
 * Category normalization rules
 * Maps article-based categories to proper product categories
 */
const CATEGORY_RULES: Array<{
  pattern: RegExp;
  exclude?: RegExp;
  category: string;
  subcategory?: string;
}> = [
  // Electronics
  { pattern: /headphone|earbuds?|airpods/i, category: 'Electronics', subcategory: 'Headphones' },
  {
    pattern: /laptop|macbook|chromebook/i,
    exclude: /(?:accessory|accessories|adapter|cable|charger|stand|bag|case|sleeve|hub|dock)/i,
    category: 'Electronics',
    subcategory: 'Laptops'
  },
  {
    pattern: /phone|smartphone|iphone|android/i,
    exclude: /(?:case|cover|holder|mount|stand)/i,
    category: 'Electronics',
    subcategory: 'Phones'
  },
  { pattern: /tv|television/i, category: 'Electronics', subcategory: 'TVs' },
  { pattern: /camera|photography/i, category: 'Electronics', subcategory: 'Cameras' },
  { pattern: /watch|smartwatch|fitness.*tracker/i, category: 'Electronics', subcategory: 'Wearables' },
  { pattern: /tablet|ipad/i, category: 'Electronics', subcategory: 'Tablets' },
  { pattern: /speaker|soundbar/i, category: 'Electronics', subcategory: 'Audio' },
  { pattern: /gaming|video.*game|nintendo|playstation|xbox/i, category: 'Electronics', subcategory: 'Gaming' },
  
  // Home & Kitchen
  { pattern: /grill|bbq|barbecue/i, category: 'Home & Kitchen', subcategory: 'Grills' },
  { pattern: /kitchen|cooking|cookware/i, category: 'Home & Kitchen', subcategory: 'Kitchen' },
  { pattern: /home.*office|desk|chair/i, category: 'Home & Kitchen', subcategory: 'Home Office' },
  { pattern: /vacuum|cleaning/i, category: 'Home & Kitchen', subcategory: 'Cleaning' },
  { pattern: /furniture/i, category: 'Home & Kitchen', subcategory: 'Furniture' },
  
  // Fashion & Apparel
  { pattern: /sock/i, category: 'Fashion', subcategory: 'Socks' },
  { pattern: /pajama|sleepwear/i, category: 'Fashion', subcategory: 'Sleepwear' },
  { pattern: /clothing|apparel|shirt|dress/i, category: 'Fashion', subcategory: 'Clothing' },
  { pattern: /shoe|sneaker|boot/i, category: 'Fashion', subcategory: 'Shoes' },
  { pattern: /bag|backpack|luggage/i, category: 'Fashion', subcategory: 'Bags' },
  { pattern: /jewelry|jewellery|necklace|bracelet|ring/i, category: 'Fashion', subcategory: 'Jewelry' },
  
  // Beauty & Personal Care
  { pattern: /(?:face|facial|skin).*mask/i, category: 'Beauty', subcategory: 'Face Masks' },
  { pattern: /skincare|skin.*care/i, category: 'Beauty', subcategory: 'Skincare' },
  { pattern: /hair.*care|shampoo|conditioner/i, category: 'Beauty', subcategory: 'Hair Care' },
  { pattern: /makeup|cosmetic/i, category: 'Beauty', subcategory: 'Makeup' },
  
  // Sports & Outdoors
  { pattern: /running.*gear|running.*shoe/i, category: 'Sports & Outdoors', subcategory: 'Running' },
  { pattern: /fitness|exercise|workout/i, category: 'Sports & Outdoors', subcategory: 'Fitness' },
  { pattern: /camping|hiking|outdoor/i, category: 'Sports & Outdoors', subcategory: 'Outdoor Gear' },
  { pattern: /beach|umbrella.*chair/i, category: 'Sports & Outdoors', subcategory: 'Beach' },
  
  // Travel
  { pattern: /travel.*gear|luggage|suitcase/i, category: 'Travel', subcategory: 'Travel Gear' },
  { pattern: /road.*trip/i, category: 'Travel', subcategory: 'Road Trip' },
  
  // Toys & Games
  { pattern: /board.*game/i, category: 'Toys & Games', subcategory: 'Board Games' },
  { pattern: /toy|kids.*gift|birthday.*party.*favor/i, category: 'Toys & Games', subcategory: 'Toys' },
  
  // Food & Beverage
  { pattern: /tinned.*fish|canned.*fish/i, category: 'Food & Beverage', subcategory: 'Tinned Fish' },
  { pattern: /food|snack|grocery/i, category: 'Food & Beverage', subcategory: 'Food' },
  { pattern: /drink|beverage|coffee|tea/i, category: 'Food & Beverage', subcategory: 'Beverages' },
  
  // Pets
  { pattern: /pet|dog|cat|animal/i, category: 'Pets', subcategory: 'Pet Supplies' },
  
  // Gifts (catch-all for gift categories)
  { pattern: /gift|present/i, category: 'Gifts', subcategory: 'Gift Ideas' },
  
  // Dorm & College
  { pattern: /dorm|college/i, category: 'Home & Kitchen', subcategory: 'Dorm Essentials' },
];

async function normalizeCategories() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to process`);

    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      // Skip if already has proper category structure
      if (product.category && !product.category.includes('-') && !product.category.includes(' ')) {
        skipped++;
        continue;
      }

      // Try to match against rules using both category and name
      const searchText = `${product.category} ${product.name}`;
      let matched = false;

      for (const rule of CATEGORY_RULES) {
        if (rule.pattern.test(searchText)) {
          // Check if we should exclude this product
          if (rule.exclude && rule.exclude.test(searchText)) {
            continue; // Skip this rule
          }

          await Product.updateOne(
            { _id: product._id },
            {
              $set: {
                category: rule.category,
                subcategory: rule.subcategory || 'Other',
              },
            }
          );
          updated++;
          matched = true;
          console.log(`✓ Updated: ${product.name} -> ${rule.category}/${rule.subcategory}`);
          break;
        }
      }

      if (!matched) {
        // Default to 'Other' category
        await Product.updateOne(
          { _id: product._id },
          {
            $set: {
              category: 'Other',
              subcategory: 'Miscellaneous',
            },
          }
        );
        updated++;
        console.log(`? Defaulted: ${product.name} -> Other/Miscellaneous`);
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total products: ${products.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error normalizing categories:', error);
    process.exit(1);
  }
}

normalizeCategories();

