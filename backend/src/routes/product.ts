import express, { Request, Response } from 'express';
import Product from '../models/Product.js';

const router = express.Router();

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
      query.category = (category as string).toLowerCase();
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

    const query: any = { category: category.toLowerCase() };

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

    const query = { category: category.toLowerCase() };

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

