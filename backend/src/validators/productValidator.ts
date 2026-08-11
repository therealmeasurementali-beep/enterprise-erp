import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().optional(),
  unitPrice: z.number().positive('Unit price must be positive'),
  currentStock: z.number().int().min(0, 'Current stock cannot be negative').optional(),
  minStockAlertQuantity: z.number().int().min(0).optional(),
  location: z.string().optional()
});

export const updateProductSchema = productSchema.partial();

export const stockMovementSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  type: z.enum(['IN', 'OUT']),
  reason: z.string().optional()
});
