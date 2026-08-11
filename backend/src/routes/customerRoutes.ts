import { Router } from 'express';
import { 
  getCustomers, 
  getCustomerById, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  getFollowUps,
  createFollowUp
} from '../controllers/customerController';
import { auth, authorize } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { createCustomerSchema, updateCustomerSchema, createFollowUpSchema } from '../validators/customerValidator';

const router = Router();

// Define roles
const readRoles = ['Admin', 'Sales', 'Accounts'];
const writeRoles = ['Admin', 'Sales'];

// Apply authentication to all customer routes
router.use(auth);

// Customer Routes
router.get('/', authorize(readRoles), getCustomers);
router.post('/', authorize(writeRoles), validateRequest(createCustomerSchema), createCustomer);

router.get('/:id', authorize(readRoles), getCustomerById);
router.put('/:id', authorize(writeRoles), validateRequest(updateCustomerSchema), updateCustomer);
router.delete('/:id', authorize(writeRoles), deleteCustomer);

// Follow-up Routes
router.get('/:id/followups', authorize(readRoles), getFollowUps);
router.post('/:id/followups', authorize(writeRoles), validateRequest(createFollowUpSchema), createFollowUp);

export default router;
