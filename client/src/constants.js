export const ROLES = {
  ORGANIZER: 'organizer',
  JUDGE: 'judge',
  PARTICIPANT: 'participant',
};

export const SIDES = {
  PROPOSITION: 'proposition',
  OPPOSITION: 'opposition',
};

export const DEBATE_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
};

// Keep in sync with server/src/constants.js
export const SCORE_MAX = 10;
export const CRITERIA = [
  { key: 'argument', label: 'Argument' },
  { key: 'rebuttal', label: 'Rebuttal' },
  { key: 'delivery', label: 'Delivery' },
];
export const MAX_TOTAL = SCORE_MAX * CRITERIA.length;
