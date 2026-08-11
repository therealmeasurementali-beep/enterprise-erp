import express from 'express';
import { getChallans, getChallanById, createChallan, updateChallan, confirmChallan, cancelChallan } from '../controllers/challanController';
import { auth, authorize } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { createChallanSchema, updateChallanSchema } from '../validators/challanValidator';

const router = express.Router();

// All challan routes require authentication
router.use(auth);

// RBAC: Admin and Sales can manage challans
router.use(authorize(['Admin', 'Sales']));

router.get('/', getChallans);
router.get('/:id', getChallanById);
router.post('/', validateRequest(createChallanSchema), createChallan);
router.put('/:id', validateRequest(updateChallanSchema), updateChallan);
router.post('/:id/confirm', confirmChallan);
router.post('/:id/cancel', cancelChallan);

export default router;
