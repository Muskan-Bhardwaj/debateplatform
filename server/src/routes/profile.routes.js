import { Router } from 'express';
import { getProfile } from '../controllers/profile.controller.js';
import { ROLES } from '../constants.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.get('/', protect, authorize(ROLES.PARTICIPANT), getProfile);

export default router;
