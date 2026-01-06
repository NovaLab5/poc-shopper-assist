import express, { Request, Response } from 'express';
import Product from '../models/Product.js';

const router = express.Router();

/**
 * Category/Subcategory mapping - maps user-friendly names to database categories
 */
const CATEGORY_MAPPING: Record<string, { category?: string; subcategory?: string }> = {
  // Electronics
  'laptops': { category: 'Electronics', subcategory: 'Laptops' },
  'headphones': { category: 'Electronics', subcategory: 'Headphones' },
  'smartphones': { category: 'Electronics', subcategory: 'Phones' },
  'phones': { category: 'Electronics', subcategory: 'Phones' },
  'tv': { category: 'Electronics', subcategory: 'TVs' },
  'tvs': { category: 'Electronics', subcategory: 'TVs' },
  'cameras': { category: 'Electronics', subcategory: 'Cameras' },
  'watches': { category: 'Electronics', subcategory: 'Wearables' },
  'tablets': { category: 'Electronics', subcategory: 'Tablets' },
  'gaming': { category: 'Electronics', subcategory: 'Gaming' },

  // Home & Kitchen
  'grills': { category: 'Home & Kitchen', subcategory: 'Grills' },
  'kitchen': { category: 'Home & Kitchen', subcategory: 'Kitchen' },
  'home-office': { category: 'Home & Kitchen', subcategory: 'Home Office' },
  'furniture': { category: 'Home & Kitchen', subcategory: 'Furniture' },
  'dorm-essentials': { category: 'Home & Kitchen', subcategory: 'Dorm Essentials' },

  // Fashion
  'socks': { category: 'Fashion', subcategory: 'Socks' },
  'pajamas': { category: 'Fashion', subcategory: 'Sleepwear' },
  'clothing': { category: 'Fashion', subcategory: 'Clothing' },
  'shoes': { category: 'Fashion', subcategory: 'Shoes' },
  'bags': { category: 'Fashion', subcategory: 'Bags' },
  'jewellery': { category: 'Fashion', subcategory: 'Jewelry' },
  'jewelry': { category: 'Fashion', subcategory: 'Jewelry' },

  // Beauty
  'facemasks': { category: 'Beauty', subcategory: 'Face Masks' },
  'skincare': { category: 'Beauty', subcategory: 'Skincare' },
  'haircare': { category: 'Beauty', subcategory: 'Hair Care' },
  'makeup': { category: 'Beauty', subcategory: 'Makeup' },

  // Sports & Outdoors
  'running': { category: 'Sports & Outdoors', subcategory: 'Running' },
  'running-gear': { category: 'Sports & Outdoors', subcategory: 'Running' },
  'fitness': { category: 'Sports & Outdoors', subcategory: 'Fitness' },
  'outdoor': { category: 'Sports & Outdoors', subcategory: 'Outdoor Gear' },
  'beach': { category: 'Sports & Outdoors', subcategory: 'Beach' },

  // Travel
  'travel': { category: 'Travel', subcategory: 'Travel Gear' },
  'travel-gear': { category: 'Travel', subcategory: 'Travel Gear' },
  'travel-gear-and-accessories': { category: 'Travel', subcategory: 'Travel Gear' },
  'road-trip': { category: 'Travel', subcategory: 'Road Trip' },

  // Toys & Games
  'board-games': { category: 'Toys & Games', subcategory: 'Board Games' },
  'toys': { category: 'Toys & Games', subcategory: 'Toys' },

  // Food & Beverage
  'tinned-fish': { category: 'Food & Beverage', subcategory: 'Tinned Fish' },
  'food': { category: 'Food & Beverage', subcategory: 'Food' },
  'beverages': { category: 'Food & Beverage', subcategory: 'Beverages' },

  // Pets
  'pets': { category: 'Pets', subcategory: 'Pet Supplies' },

  // Gifts
  'gifts': { category: 'Gifts', subcategory: 'Gift Ideas' },
  'luxurious-gifts': { category: 'Gifts', subcategory: 'Gift Ideas' },
  'anniversary-gifts': { category: 'Gifts', subcategory: 'Gift Ideas' },
  'retirement-gifts': { category: 'Gifts', subcategory: 'Gift Ideas' },
  'self-care-gifts-for-yourself': { category: 'Gifts', subcategory: 'Gift Ideas' },
  '25-kids-birthday-party-favors': { category: 'Toys & Games', subcategory: 'Toys' },
  'college-dorm-essentials': { category: 'Home & Kitchen', subcategory: 'Dorm Essentials' },
};

/**
 * Normalize category - converts user-friendly category to database query
 */
function normalizeCategory(category: string): any {
  const normalized = category.toLowerCase();

  // Check if we have a mapping for this category
  if (CATEGORY_MAPPING[normalized]) {
    const mapping = CATEGORY_MAPPING[normalized];
    const query: any = {};

    if (mapping.category) {
      query.category = mapping.category;
    }
    if (mapping.subcategory) {
      query.subcategory = mapping.subcategory;
    }

    return query;
  }

  // If no mapping, try to match by subcategory (case-insensitive)
  return { subcategory: new RegExp(`^${normalized}$`, 'i') };
}

/**
 * GET /api/v1/products
 * Get all products with optional filters
 * Query params: category, minPrice, maxPrice, tags, search
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, minPrice, maxPrice, tags, search } = req.query;
    
    // Build query
    const query: any = {};

    if (category) {
      const categoryQuery = normalizeCategory(category as string);
      // Merge the category query into the main query
      Object.assign(query, categoryQuery);
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    if (tags) {
      const tagArray = (tags as string).split(',').map(t => t.trim());
      query.tags = { $in: tagArray };
    }
    
    if (search) {
      query.$text = { $search: search as string };
    }
    
    const products = await Product.find(query).sort({ price: 1 });
    
    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
    });
  }
});

/**
 * GET /api/v1/products/:id
 * Get a single product by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findOne({ id });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found: ${id}`,
      });
    }
    
    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
    });
  }
});

/**
 * GET /api/v1/products/category/:category
 * Get products by category with optional budget filter
 * Query params: budget (max price)
 */
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { budget } = req.query;

    const query: any = normalizeCategory(category);

    if (budget) {
      query.price = { $lte: Number(budget) };
    }

    const products = await Product.find(query).sort({ price: 1 });

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
    });
  }
});

/**
 * GET /api/v1/products/category/:category/price-range
 * Get min and max price for products in a category
 */
router.get('/category/:category/price-range', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;

    const query = normalizeCategory(category);

    // Find min and max prices using aggregation
    const result = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (!result || result.length === 0) {
      return res.json({
        success: true,
        data: {
          minPrice: 0,
          maxPrice: 1000,
          count: 0
        }
      });
    }

    // Round to nearest integer
    const minPrice = Math.floor(result[0].minPrice);
    const maxPrice = Math.ceil(result[0].maxPrice);

    res.json({
      success: true,
      data: {
        minPrice,
        maxPrice,
        count: result[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching price range:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price range',
    });
  }
});

/**
 * POST /api/v1/products
 * Create a new product (admin only - add auth later)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    
    // Check if product with same ID already exists
    const existing = await Product.findOne({ id: productData.id });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Product with this ID already exists',
      });
    }
    
    const product = new Product(productData);
    await product.save();
    
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
    });
  }
});

export default router;

