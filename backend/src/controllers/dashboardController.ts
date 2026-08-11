import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

export const getSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    let customerCount = 0;
    let productCount = 0;
    let challanCount = 0;
    let lowStockCount = 0;

    // Depending on role, we fetch metrics.
    // Admin: everything
    // Sales: customers, challans
    // Warehouse: products, low stock
    // Accounts: challans

    if (role === 'Admin' || role === 'Sales') {
      customerCount = await prisma.customer.count();
      challanCount = await prisma.salesChallan.count();
    }
    
    if (role === 'Admin' || role === 'Warehouse') {
      productCount = await prisma.product.count();
      const products = await prisma.product.findMany({ select: { currentStock: true, minStockAlertQuantity: true } });
      lowStockCount = products.filter(p => p.currentStock <= p.minStockAlertQuantity).length;
    }

    if (role === 'Accounts') {
      challanCount = await prisma.salesChallan.count();
    }

    res.json({
      role,
      summary: {
        customers: customerCount,
        products: productCount,
        challans: challanCount,
        lowStock: lowStockCount
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error' });
  }
};
