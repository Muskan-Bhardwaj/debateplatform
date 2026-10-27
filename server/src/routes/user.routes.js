import { Router } from 'express';
import { listUsers } from '../controllers/user.controller.js';
import { ROLES } from '../constants.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listUsersQuery } from '../validators/user.js';

const router = Router();

router.use(protect, authorize(ROLES.ORGANIZER));
router.get('/', validate(listUsersQuery, 'query'), listUsers);

export default router;
