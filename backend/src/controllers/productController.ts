import { Request, Response } from 'express';
import prisma from '../config/db';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    let whereClause = {};

    if (search) {
      const searchString = String(search);
      whereClause = {
        OR: [
          { name: { contains: searchString, mode: 'insensitive' } },
          { sku: { contains: searchString, mode: 'insensitive' } },
          { category: { contains: searchString, mode: 'insensitive' } }
        ]
      };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    res.json({ products });
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        movements: {
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlertQuantity, location } = req.body;
    
    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      res.status(400).json({ message: 'Product with this SKU already exists' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category,
        unitPrice,
        currentStock: currentStock || 0,
        minStockAlertQuantity: minStockAlertQuantity ?? 10,
        location
      }
    });

    res.status(201).json(product);
  } catch (error: any) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, sku, category, unitPrice, minStockAlertQuantity, location } = req.body;

    // Check SKU uniqueness if changing SKU
    if (sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku } });
      if (existingSku && existingSku.id !== id) {
        res.status(400).json({ message: 'SKU is already in use' });
        return;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        category,
        unitPrice,
        minStockAlertQuantity,
        location
      }
    });

    res.json(product);
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.status(500).json({ message: 'Server Error' });
    }
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    // Check if there are movements or challan items (if Prisma doesn't cascade, but it's better to prevent deletion if there is stock history)
    const movementsCount = await prisma.stockMovement.count({ where: { productId: id } });
    if (movementsCount > 0) {
       res.status(400).json({ message: 'Cannot delete product with existing stock movements. Deactivate it instead.' });
       return;
    }

    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.status(500).json({ message: 'Server Error' });
    }
  }
};
