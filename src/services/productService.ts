/**
 * Product Service
 * Handles all product-related API calls
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  tags: string[];
  price: number;
  amazonUrl: string;
  imageUrl?: string;
  rating?: number;
  store?: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  search?: string;
}

/**
 * Get all products with optional filters
 */
export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    
    if (filters?.category) {
      params.append('category', filters.category);
    }
    if (filters?.minPrice !== undefined) {
      params.append('minPrice', filters.minPrice.toString());
    }
    if (filters?.maxPrice !== undefined) {
      params.append('maxPrice', filters.maxPrice.toString());
    }
    if (filters?.tags && filters.tags.length > 0) {
      params.append('tags', filters.tags.join(','));
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const url = `${API_BASE_URL}/api/v1/products${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/products/${id}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

/**
 * Get products by category with optional budget filter
 */
export async function getProductsByCategory(
  category: string,
  budget?: number
): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (budget !== undefined) {
      params.append('budget', budget.toString());
    }

    const url = `${API_BASE_URL}/api/v1/products/category/${category}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
}

/**
 * Get price range for a category
 */
export async function getCategoryPriceRange(
  category: string
): Promise<{ minPrice: number; maxPrice: number; count: number }> {
  try {
    const url = `${API_BASE_URL}/api/v1/products/category/${category}/price-range`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch price range: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || { minPrice: 0, maxPrice: 1000, count: 0 };
  } catch (error) {
    console.error('Error fetching price range:', error);
    // Return default range on error
    return { minPrice: 0, maxPrice: 1000, count: 0 };
  }
}

/**
 * Transform API product to component format
 * (for compatibility with existing components)
 */
export function transformProductForComponent(product: Product) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    store: product.store || 'Amazon',
    image: product.imageUrl || '',
    rating: product.rating || 4.5,
    url: product.amazonUrl,
  };
}

/**
 * Transform multiple products for component format
 */
export function transformProductsForComponent(products: Product[]) {
  return products.map(transformProductForComponent);
}

