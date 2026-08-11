import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { auth, authorize } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { productSchema, updateProductSchema } from '../validators/productValidator';

const router = Router();

// Inventory RBAC: Admin and Warehouse allowed. Sales and Accounts denied.
const inventoryRoles = ['Admin', 'Warehouse'];

router.get('/', auth, authorize(inventoryRoles), getProducts);
router.get('/:id', auth, authorize(inventoryRoles), getProductById);
router.post('/', auth, authorize(inventoryRoles), validateRequest(productSchema), createProduct);
router.put('/:id', auth, authorize(inventoryRoles), validateRequest(updateProductSchema), updateProduct);
router.delete('/:id', auth, authorize(inventoryRoles), deleteProduct);

export default router;
