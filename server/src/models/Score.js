import mongoose from 'mongoose';
import { SCORE_MAX } from '../constants.js';

const { ObjectId } = mongoose.Schema.Types;

const mark = {
  type: Number,
  required: true,
  min: 0,
  max: SCORE_MAX,
  validate: { validator: Number.isInteger, message: '{PATH} must be a whole number' },
};

// One score = one judge grading one participant in one debate.
const scoreSchema = new mongoose.Schema(
  {
    debate: { type: ObjectId, ref: 'Debate', required: true },
    judge: { type: ObjectId, ref: 'User', required: true },
    participant: { type: ObjectId, ref: 'User', required: true },
    argument: mark,
    rebuttal: mark,
    delivery: mark,
    total: { type: Number, required: true },
    feedback: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

// A judge can only have one score per participant per debate (updates overwrite it).
scoreSchema.index({ debate: 1, judge: 1, participant: 1 }, { unique: true });
scoreSchema.index({ participant: 1 });

export default mongoose.model('Score', scoreSchema);
