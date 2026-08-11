import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

function generateChallanNumber(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CHL-${yyyy}${mm}${dd}-${random}`;
}

export const getChallans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const challans = await prisma.salesChallan.findMany({
      orderBy: { createdDate: 'desc' },
      include: {
        customer: { select: { name: true } },
        user: { select: { name: true } },
        items: true
      }
    });
    res.json({ challans });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getChallanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true, currentStock: true } }
          }
        }
      }
    });

    if (!challan) {
      res.status(404).json({ message: 'Challan not found' });
      return;
    }

    res.json(challan);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId, items } = req.body;
    const userId = req.user!.id;

    // Fetch product details to create snapshot
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
      res.status(400).json({ message: 'One or more products are invalid' });
      return;
    }

    let totalQuantity = 0;
    const challanItemsData = items.map((item: any) => {
      const p = products.find(prod => prod.id === item.productId)!;
      totalQuantity += item.quantity;
      return {
        productId: p.id,
        productNameSnapshot: p.name,
        skuSnapshot: p.sku,
        unitPriceSnapshot: p.unitPrice,
        quantity: item.quantity
      };
    });

    const challan = await prisma.salesChallan.create({
      data: {
        challanNumber: generateChallanNumber(),
        customerId,
        totalQuantity,
        status: 'Draft',
        createdBy: userId,
        items: {
          create: challanItemsData
        }
      },
      include: { items: true }
    });

    res.status(201).json(challan);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { customerId, items } = req.body;

    const existingChallan = await prisma.salesChallan.findUnique({ where: { id } });
    if (!existingChallan) {
      res.status(404).json({ message: 'Challan not found' });
      return;
    }

    if (existingChallan.status !== 'Draft') {
      res.status(400).json({ message: 'Only Draft challans can be edited' });
      return;
    }

    // Prepare new snapshot
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

    if (products.length !== productIds.length) {
      res.status(400).json({ message: 'One or more products are invalid' });
      return;
    }

    let totalQuantity = 0;
    const challanItemsData = items.map((item: any) => {
      const p = products.find(prod => prod.id === item.productId)!;
      totalQuantity += item.quantity;
      return {
        productId: p.id,
        productNameSnapshot: p.name,
        skuSnapshot: p.sku,
        unitPriceSnapshot: p.unitPrice,
        quantity: item.quantity
      };
    });

    // Update using transaction to replace items
    const updatedChallan = await prisma.$transaction(async (tx: any) => {
      await tx.challanItem.deleteMany({ where: { challanId: id } });
      return tx.salesChallan.update({
        where: { id },
        data: {
          customerId,
          totalQuantity,
          items: {
            create: challanItemsData
          }
        },
        include: { items: true }
      });
    });

    res.json(updatedChallan);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const cancelChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingChallan = await prisma.salesChallan.findUnique({ where: { id } });
    if (!existingChallan) {
      res.status(404).json({ message: 'Challan not found' });
      return;
    }

    if (existingChallan.status === 'Confirmed') {
      res.status(400).json({ message: 'Cannot cancel a Confirmed challan' });
      return;
    }

    const challan = await prisma.salesChallan.update({
      where: { id },
      data: { status: 'Cancelled' }
    });

    res.json(challan);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const confirmChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Verify challan exists and is Draft
      const challan = await tx.salesChallan.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!challan) throw new Error('Challan not found');
      if (challan.status !== 'Draft') throw new Error('Only Draft challans can be confirmed');

      // 2. Fetch all products needed to check stock and lock if necessary
      const productIds = challan.items.map((i: any) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } }
      });

      if (products.length !== productIds.length) {
        throw new Error('Some products in the challan no longer exist');
      }

      const productMap = new Map();
      products.forEach((p: any) => productMap.set(p.id, p));

      // 3. Verify sufficient stock for EVERY item before making any changes
      for (const item of challan.items) {
        const p = productMap.get(item.productId);
        if (p.currentStock < item.quantity) {
           throw new Error(`Insufficient stock for product ${p.name} (SKU: ${p.sku})`);
        }
      }

      // 4. If all products have sufficient stock, deduct stock and create stock movements
      for (const item of challan.items) {
        // Deduct stock
        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: { decrement: item.quantity }
          }
        });

        // Fail-safe check
        if (updatedProduct.currentStock < 0) {
           throw new Error(`Race condition detected: Insufficient stock for product ${updatedProduct.name}`);
        }

        // Create StockMovement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            type: 'OUT',
            reason: `Sales Challan Confirmation: ${challan.challanNumber}`,
            createdBy: userId
          }
        });
      }

      // 5. Change challan status to Confirmed
      return tx.salesChallan.update({
        where: { id },
        data: { status: 'Confirmed' }
      });
    });

    res.json({ message: 'Challan confirmed successfully', challan: result });
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('Insufficient stock') || error.message.includes('Only Draft') || error.message.includes('no longer exist')) {
      res.status(400).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
};
