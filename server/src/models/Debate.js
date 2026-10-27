import mongoose from 'mongoose';
import { DEBATE_STATUS, SIDES } from '../constants.js';

const { ObjectId } = mongoose.Schema.Types;

const participantSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true },
    side: { type: String, enum: Object.values(SIDES), required: true },
  },
  { _id: false }
);

const debateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    motion: { type: ObjectId, ref: 'Motion', required: true },
    scheduledAt: { type: Date, required: true },
    venue: { type: String, trim: true, maxlength: 120, default: '' },
    judges: [{ type: ObjectId, ref: 'User' }],
    participants: [participantSchema],
    status: {
      type: String,
      enum: Object.values(DEBATE_STATUS),
      default: DEBATE_STATUS.SCHEDULED,
    },
    completedAt: { type: Date },
    createdBy: { type: ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

debateSchema.index({ judges: 1 });
debateSchema.index({ 'participants.user': 1 });
debateSchema.index({ motion: 1 });

export default mongoose.model('Debate', debateSchema);
