import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../src/models/Product';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:sweetdill123@localhost:27017/sweetdill?authSource=admin';

interface CleanupRule {
  category: string;
  subcategory?: string;
  removePatterns: RegExp[];
  minPriceThreshold?: number;
  description: string;
}

const CLEANUP_RULES: CleanupRule[] = [
  // Electronics - Laptops
  {
    category: 'Electronics',
    subcategory: 'Laptops',
    removePatterns: [
      /adapter|cable|charger|stand|bag|case|sleeve|hub|dock|mouse|keyboard|cooler|cooling pad/i,
    ],
    minPriceThreshold: 100,
    description: 'Remove laptop accessories and items under $100',
  },
  
  // Electronics - Phones
  {
    category: 'Electronics',
    subcategory: 'Phones',
    removePatterns: [
      /case|cover|holder|mount|stand|screen protector|pouch|wallet|app|iOS|Android/i,
    ],
    minPriceThreshold: 50,
    description: 'Remove phone accessories, apps, and items under $50',
  },
  
  // Electronics - Tablets
  {
    category: 'Electronics',
    subcategory: 'Tablets',
    removePatterns: [
      /case|cover|stand|stylus|pen|keyboard|screen protector/i,
    ],
    minPriceThreshold: 50,
    description: 'Remove tablet accessories and items under $50',
  },
  
  // Electronics - Cameras
  {
    category: 'Electronics',
    subcategory: 'Cameras',
    removePatterns: [
      /bag|case|strap|lens cap|memory card|sd card|tripod|battery|charger/i,
    ],
    minPriceThreshold: 50,
    description: 'Remove camera accessories and items under $50',
  },
  
  // Electronics - Gaming
  {
    category: 'Electronics',
    subcategory: 'Gaming',
    removePatterns: [
      /controller case|headset stand|charging dock|cable|adapter/i,
    ],
    minPriceThreshold: 15,
    description: 'Remove gaming accessories under $15',
  },
  
  // Electronics - TVs
  {
    category: 'Electronics',
    subcategory: 'TVs',
    removePatterns: [
      /mount|bracket|stand|cable|remote|antenna/i,
    ],
    minPriceThreshold: 100,
    description: 'Remove TV accessories and items under $100',
  },
  
  // Beauty - Face Masks
  {
    category: 'Beauty',
    subcategory: 'Face Masks',
    removePatterns: [
      /kn95|n95|surgical|procedure.*mask|covid|medical|disposable/i,
    ],
    description: 'Remove COVID/medical masks from beauty category',
  },
  
  // Fashion - Shoes
  {
    category: 'Fashion',
    subcategory: 'Shoes',
    removePatterns: [
      /wax|polish|cleaner|protector|spray|cream|conditioner|laces|insole|insert|instruction|card/i,
    ],
    minPriceThreshold: 15,
    description: 'Remove shoe care products and items under $15',
  },
  
  // Fashion - Jewelry
  {
    category: 'Fashion',
    subcategory: 'Jewelry',
    removePatterns: [
      /measuring cup|organizer|box|cleaner|polish|storage/i,
    ],
    description: 'Remove non-jewelry items',
  },
  
  // Fashion - Clothing
  {
    category: 'Fashion',
    subcategory: 'Clothing',
    removePatterns: [
      /hanger|laundry|detergent|fabric softener|stain remover/i,
    ],
    description: 'Remove clothing care products',
  },
  
  // Home & Kitchen - Grills
  {
    category: 'Home & Kitchen',
    subcategory: 'Grills',
    removePatterns: [
      /sauce|seasoning|rub|marinade|spice|brush|tongs|thermometer/i,
    ],
    minPriceThreshold: 30,
    description: 'Remove BBQ accessories and condiments',
  },
  
  // Home & Kitchen - Kitchen
  {
    category: 'Home & Kitchen',
    subcategory: 'Kitchen',
    removePatterns: [
      /battery|power bank|usb|cable|adapter|headphone|mouse|keyboard|monitor/i,
    ],
    description: 'Remove electronics miscategorized as kitchen items',
  },
];

async function cleanupCategories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    let totalRemoved = 0;
    
    for (const rule of CLEANUP_RULES) {
      console.log(`\n=== Processing: ${rule.category}/${rule.subcategory || 'All'} ===`);
      console.log(`Rule: ${rule.description}`);
      
      const query: any = {
        category: rule.category,
      };
      
      if (rule.subcategory) {
        query.subcategory = rule.subcategory;
      }
      
      // Build the $or condition for pattern matching
      const orConditions: any[] = [];
      
      for (const pattern of rule.removePatterns) {
        orConditions.push({ name: { $regex: pattern } });
      }
      
      if (rule.minPriceThreshold) {
        orConditions.push({ price: { $lt: rule.minPriceThreshold } });
      }
      
      if (orConditions.length > 0) {
        query.$or = orConditions;
      }

      // Find products to remove
      const productsToRemove = await Product.find(query);

      if (productsToRemove.length === 0) {
        console.log('No products to remove');
        continue;
      }

      console.log(`Found ${productsToRemove.length} products to move to Miscellaneous:`);

      // Show first 5 examples
      for (let i = 0; i < Math.min(5, productsToRemove.length); i++) {
        const p = productsToRemove[i];
        console.log(`  - ${p.name} ($${p.price})`);
      }

      if (productsToRemove.length > 5) {
        console.log(`  ... and ${productsToRemove.length - 5} more`);
      }

      // Move to Miscellaneous
      const result = await Product.updateMany(
        query,
        {
          $set: {
            category: 'Other',
            subcategory: 'Miscellaneous',
          },
        }
      );

      console.log(`✓ Moved ${result.modifiedCount} products to Other/Miscellaneous`);
      totalRemoved += result.modifiedCount;
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total products moved to Miscellaneous: ${totalRemoved}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupCategories();

