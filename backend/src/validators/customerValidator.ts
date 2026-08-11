import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  mobile: z.string().min(1, 'Mobile number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  type: z.enum(['Retail', 'Wholesale', 'Distributor']).default('Retail'),
  address: z.string().optional(),
  status: z.enum(['Lead', 'Active', 'Inactive']).default('Lead'),
  followUpDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional()
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createFollowUpSchema = z.object({
  notes: z.string().min(1, 'Notes are required'),
  date: z.string().datetime('Valid date is required')
});
