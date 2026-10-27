import { Router } from 'express';
import {
  completeDebate,
  createDebate,
  deleteDebate,
  getDebate,
  getDebateResults,
  listDebates,
  updateDebate,
} from '../controllers/debate.controller.js';
import { ROLES } from '../constants.js';
import { authorize, protect } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { debateSchema } from '../validators/debate.js';
import scoreRoutes from './score.routes.js';

const router = Router();
const organizerOnly = authorize(ROLES.ORGANIZER);

router.use(protect);

router.get('/', listDebates);
router.post('/', organizerOnly, validate(debateSchema), createDebate);

router.use('/:debateId/scores', scoreRoutes);

router.get('/:id', validateObjectId('id'), getDebate);
router.put('/:id', organizerOnly, validateObjectId('id'), validate(debateSchema), updateDebate);
router.delete('/:id', organizerOnly, validateObjectId('id'), deleteDebate);
router.patch('/:id/complete', organizerOnly, validateObjectId('id'), completeDebate);
router.get('/:id/results', organizerOnly, validateObjectId('id'), getDebateResults);

export default router;
