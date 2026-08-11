import { Router } from 'express';
import { getStockMovements, getLowStockProducts, createStockMovement } from '../controllers/stockController';
import { auth, authorize } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { stockMovementSchema } from '../validators/productValidator';

const router = Router();

const inventoryRoles = ['Admin', 'Warehouse'];

router.get('/movements', auth, authorize(inventoryRoles), getStockMovements);
router.get('/low-stock', auth, authorize(inventoryRoles), getLowStockProducts);
router.post('/movements', auth, authorize(inventoryRoles), validateRequest(stockMovementSchema), createStockMovement);

export default router;
