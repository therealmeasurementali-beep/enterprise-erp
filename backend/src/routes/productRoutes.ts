import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { auth, authorize } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { productSchema, updateProductSchema } from '../validators/productValidator';

const router = Router();

// Inventory RBAC: Read allowed for Admin, Warehouse, Sales. Write allowed for Admin and Warehouse only.
const readRoles = ['Admin', 'Warehouse', 'Sales'];
const writeRoles = ['Admin', 'Warehouse'];

router.get('/', auth, authorize(readRoles), getProducts);
router.get('/:id', auth, authorize(readRoles), getProductById);
router.post('/', auth, authorize(writeRoles), validateRequest(productSchema), createProduct);
router.put('/:id', auth, authorize(writeRoles), validateRequest(updateProductSchema), updateProduct);
router.delete('/:id', auth, authorize(writeRoles), deleteProduct);

export default router;
