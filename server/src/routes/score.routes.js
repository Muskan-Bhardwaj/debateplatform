import { Router } from 'express';
import { getMyScores, saveScore } from '../controllers/score.controller.js';
import { ROLES } from '../constants.js';
import { authorize } from '../middleware/auth.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { scoreSchema } from '../validators/score.js';

// Mounted at /api/debates/:debateId/scores (auth is applied by the debate router).
const router = Router({ mergeParams: true });

router.use(authorize(ROLES.JUDGE));

router.get('/mine', validateObjectId('debateId'), getMyScores);
router.put(
  '/:participantId',
  validateObjectId('debateId', 'participantId'),
  validate(scoreSchema),
  saveScore
);

export default router;
