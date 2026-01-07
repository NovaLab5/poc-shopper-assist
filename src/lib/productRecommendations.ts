/**
 * Product AI Recommendation Generator
 * Generates personalized AI recommendation text for products based on their features and tags
 */

interface ProductForRecommendation {
  id: string;
  name: string;
  brand: string;
  tags: string[];
  price: number;
  category?: string;
}

/**
 * Generate AI recommendation text for a product
 * Returns a brief explanation of why this product is a perfect match
 */
export function generateAIRecommendation(product: ProductForRecommendation): string {
  const { name, brand, tags, price, category } = product;
  
  // Grill recommendations
  if (category?.toLowerCase().includes('grill') || name.toLowerCase().includes('grill')) {
    return generateGrillRecommendation(product);
  }
  
  // Shoe recommendations
  if (category?.toLowerCase().includes('shoe') || category?.toLowerCase().includes('skecher')) {
    return generateShoeRecommendation(product);
  }
  
  // Generic recommendation based on tags
  return generateGenericRecommendation(product);
}

function generateGrillRecommendation(product: ProductForRecommendation): string {
  const { brand, tags, price } = product;
  const features: string[] = [];
  
  // Analyze tags to build recommendation
  if (tags.includes('premium') || tags.includes('high-end')) {
    features.push('premium construction and materials');
  }
  
  if (tags.includes('propane') || tags.includes('gas')) {
    features.push('reliable propane/gas heating');
  }
  
  if (tags.includes('electric')) {
    features.push('convenient electric operation');
  }
  
  if (tags.includes('charcoal')) {
    features.push('authentic charcoal flavor');
  }
  
  if (tags.includes('portable') || tags.includes('compact')) {
    features.push('portable design for easy transport');
  }
  
  if (tags.includes('versatile') || tags.includes('combo')) {
    features.push('versatile cooking options');
  }
  
  if (tags.includes('quality') || tags.includes('durable')) {
    features.push('exceptional durability');
  }
  
  if (brand.toLowerCase() === 'weber') {
    features.push('Weber\'s legendary quality and performance');
  }
  
  // Build recommendation text
  if (features.length >= 2) {
    return `This grill excels with ${features[0]}, ${features[1]}${features.length > 2 ? `, and ${features[2]}` : ''}. Perfect for your grilling needs.`;
  } else if (features.length === 1) {
    return `This grill stands out with ${features[0]}, making it an excellent choice for outdoor cooking.`;
  }
  
  // Fallback based on price
  if (price > 800) {
    return 'Premium grill with professional-grade features, superior heat distribution, and long-lasting construction.';
  } else if (price > 400) {
    return 'Great balance of quality and value with reliable performance and versatile cooking capabilities.';
  } else {
    return 'Excellent value option with solid performance and all the essential features you need.';
  }
}

function generateShoeRecommendation(product: ProductForRecommendation): string {
  const { tags, price } = product;
  const features: string[] = [];
  
  // Analyze tags
  if (tags.includes('comfort') || tags.includes('cushioned')) {
    features.push('exceptional comfort and cushioning');
  }
  
  if (tags.includes('athletic') || tags.includes('running')) {
    features.push('athletic performance features');
  }
  
  if (tags.includes('casual') || tags.includes('everyday')) {
    features.push('versatile everyday style');
  }
  
  if (tags.includes('memory-foam')) {
    features.push('memory foam insoles for all-day comfort');
  }
  
  if (tags.includes('breathable')) {
    features.push('breathable materials');
  }
  
  if (tags.includes('lightweight')) {
    features.push('lightweight construction');
  }
  
  // Build recommendation
  if (features.length >= 2) {
    return `These shoes deliver ${features[0]} with ${features[1]}. Ideal for all-day wear.`;
  } else if (features.length === 1) {
    return `These shoes feature ${features[0]}, making them perfect for your needs.`;
  }
  
  // Fallback
  if (price > 80) {
    return 'Premium footwear with superior comfort, support, and style for all-day wear.';
  } else {
    return 'Great value shoes combining comfort, style, and durability for everyday use.';
  }
}

function generateGenericRecommendation(product: ProductForRecommendation): string {
  const { tags, price, brand } = product;
  
  // Check for quality indicators
  const isHighQuality = tags.includes('premium') || tags.includes('quality') || tags.includes('high-end');
  const isPopular = tags.includes('popular') || tags.includes('bestseller');
  const isVersatile = tags.includes('versatile') || tags.includes('multi-purpose');
  
  if (isHighQuality && isPopular) {
    return `${brand} delivers premium quality with proven popularity. Features excellent craftsmanship and reliable performance.`;
  }
  
  if (isVersatile) {
    return 'Versatile design with multiple uses, combining quality construction with practical functionality.';
  }
  
  if (price > 500) {
    return 'Premium product with superior features, exceptional quality, and long-lasting durability.';
  } else if (price > 200) {
    return 'Excellent balance of quality and value with reliable performance and thoughtful design.';
  } else {
    return 'Great value option with solid features and dependable performance for everyday use.';
  }
}

