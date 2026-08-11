import express from 'express';
import { getChallans, getChallanById, createChallan, updateChallan, confirmChallan, cancelChallan } from '../controllers/challanController';
import { auth, authorize } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { createChallanSchema, updateChallanSchema } from '../validators/challanValidator';

const router = express.Router();

// All challan routes require authentication
router.use(auth);

// Define roles
const readRoles = ['Admin', 'Sales', 'Accounts'];
const writeRoles = ['Admin', 'Sales'];

router.get('/', authorize(readRoles), getChallans);
router.get('/:id', authorize(readRoles), getChallanById);
router.post('/', authorize(writeRoles), validateRequest(createChallanSchema), createChallan);
router.put('/:id', authorize(writeRoles), validateRequest(updateChallanSchema), updateChallan);
router.post('/:id/confirm', authorize(writeRoles), confirmChallan);
router.post('/:id/cancel', authorize(writeRoles), cancelChallan);

export default router;
