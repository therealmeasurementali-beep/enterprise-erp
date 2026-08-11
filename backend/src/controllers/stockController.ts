import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';

export const getStockMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    const movements = await prisma.stockMovement.findMany({
      orderBy: { timestamp: 'desc' },
      include: {
        product: {
          select: { name: true, sku: true, currentStock: true }
        },
        user: {
          select: { name: true }
        }
      }
    });
    res.json({ movements });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getLowStockProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const lowStockProducts = await prisma.$queryRaw`
      SELECT id, name, sku, category, "unitPrice", "currentStock", "minStockAlertQuantity", location 
      FROM "Product"
      WHERE "currentStock" <= "minStockAlertQuantity"
      ORDER BY name ASC
    `;

    res.json({ products: lowStockProducts });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createStockMovement = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { productId, quantity, type, reason } = req.body;

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Get the current product with a lock if possible, or just read it
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new Error('Product not found');
      }

      // 2. Validate quantity (handled by Zod mostly, but double check)
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      // 3. Prevent negative stock on OUT
      if (type === 'OUT' && quantity > product.currentStock) {
        throw new Error('Insufficient stock for this OUT movement');
      }

      // 4. Record the movement
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantityChanged: quantity,
          type,
          reason,
          createdBy: userId
        }
      });

      // 5. Update the stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: type === 'IN' 
            ? { increment: quantity }
            : { decrement: quantity }
        }
      });

      // 6. Double check it didn't go below 0 just in case of race condition 
      // (though Prisma transactions generally protect this depending on isolation level, explicit check helps)
      if (updatedProduct.currentStock < 0) {
         throw new Error('Race condition detected: Stock cannot fall below zero');
      }

      return { movement, updatedProduct };
    });

    res.status(201).json({ 
      message: 'Stock movement recorded successfully', 
      movement: result.movement,
      currentStock: result.updatedProduct.currentStock
    });

  } catch (error: any) {
    if (error.message === 'Product not found') {
      res.status(404).json({ message: error.message });
    } else if (error.message === 'Insufficient stock for this OUT movement' || error.message === 'Quantity must be greater than 0') {
      res.status(400).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: error.message || 'Server Error' });
    }
  }
};
