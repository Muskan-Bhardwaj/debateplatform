import { Router } from 'express';
import {
  createMotion,
  deleteMotion,
  listMotions,
  updateMotion,
} from '../controllers/motion.controller.js';
import { ROLES } from '../constants.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { motionSchema } from '../validators/motion.js';

const router = Router();

router.use(protect, authorize(ROLES.ORGANIZER));

router.route('/').get(listMotions).post(validate(motionSchema), createMotion);
router
  .route('/:id')
  .put(validateObjectId('id'), validate(motionSchema), updateMotion)
  .delete(validateObjectId('id'), deleteMotion);

export default router;
