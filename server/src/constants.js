export const ROLES = Object.freeze({
  ORGANIZER: 'organizer',
  JUDGE: 'judge',
  PARTICIPANT: 'participant',
});

export const DEBATE_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
});

export const SIDES = Object.freeze({
  PROPOSITION: 'proposition',
  OPPOSITION: 'opposition',
});

// Judges score each participant on these criteria, each from 0 to SCORE_MAX.
export const CRITERIA = Object.freeze(['argument', 'rebuttal', 'delivery']);
export const SCORE_MAX = 10;
