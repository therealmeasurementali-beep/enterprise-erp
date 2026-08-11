import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../config/db';

export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { mobile: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { businessName: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    res.json({
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          include: { assignedTo: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customer = await prisma.customer.create({
      data: req.body
    });
    res.status(201).json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    // Check if exists
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: req.body
    });
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    await prisma.customer.delete({ where: { id } });
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getFollowUps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const followUps = await prisma.followUp.findMany({
      where: { customerId: id },
      include: { assignedTo: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(followUps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { notes, date } = req.body;
    const userId = req.user!.id;

    // Verify customer exists
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const followUp = await prisma.followUp.create({
      data: {
        customerId: id,
        userId,
        notes,
        date: new Date(date)
      },
      include: { assignedTo: { select: { name: true, role: true } } }
    });

    // Optionally update customer followUpDate
    await prisma.customer.update({
      where: { id },
      data: { followUpDate: new Date(date) }
    });

    res.status(201).json(followUp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
