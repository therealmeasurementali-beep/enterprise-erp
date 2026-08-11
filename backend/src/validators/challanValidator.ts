import { z } from 'zod';

const challanItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export const createChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  items: z.array(challanItemSchema).min(1, 'A challan must contain at least one item'),
});

export const updateChallanSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  items: z.array(challanItemSchema).min(1, 'A challan must contain at least one item'),
});
