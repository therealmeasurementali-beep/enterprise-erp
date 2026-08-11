import express from 'express';
import { getSummary } from '../controllers/dashboardController';
import { auth } from '../middleware/authMiddleware';

const router = express.Router();

router.use(auth);

router.get('/summary', getSummary);

export default router;
