// Fills the database with demo data. WARNING: deletes all existing users, motions, debates and scores.
// Usage: npm run seed
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { DEBATE_STATUS, ROLES, SIDES } from './constants.js';
import Debate from './models/Debate.js';
import Motion from './models/Motion.js';
import Score from './models/Score.js';
import User from './models/User.js';

const PASSWORD = 'Password123';
const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (days, hour = 15) => {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function seed() {
  if (env.nodeEnv === 'production' && !process.argv.includes('--force')) {
    throw new Error('Refusing to wipe a production database. Re-run with --force if you really mean it.');
  }

  await connectDB();
  await Promise.all([User.deleteMany(), Motion.deleteMany(), Debate.deleteMany(), Score.deleteMany()]);

  const make = (role, name, email) => ({ role, name, email, password: PASSWORD });
  const [organizer, j1, j2, j3, p1, p2, p3, p4, p5, p6] = await User.create([
    make(ROLES.ORGANIZER, 'Neha Sharma', 'organizer@demo.com'),
    make(ROLES.JUDGE, 'Dr. Anita Rao', 'judge1@demo.com'),
    make(ROLES.JUDGE, 'Vikram Desai', 'judge2@demo.com'),
    make(ROLES.JUDGE, 'Priya Menon', 'judge3@demo.com'),
    make(ROLES.PARTICIPANT, 'Aarav Mehta', 'participant1@demo.com'),
    make(ROLES.PARTICIPANT, 'Diya Nair', 'participant2@demo.com'),
    make(ROLES.PARTICIPANT, 'Rohan Iyer', 'participant3@demo.com'),
    make(ROLES.PARTICIPANT, 'Sneha Kapoor', 'participant4@demo.com'),
    make(ROLES.PARTICIPANT, 'Kabir Singh', 'participant5@demo.com'),
    make(ROLES.PARTICIPANT, 'Meera Joshi', 'participant6@demo.com'),
  ]);

  const [m1, m2, m3, m4] = await Motion.create(
    [
      {
        title: 'This House believes that social media does more harm than good to society.',
        description: 'Consider mental health, misinformation, and the benefits of connection and access to information.',
      },
      {
        title: 'This House would make voting compulsory in national elections.',
        description: 'Assume fines for non-voting with exemptions for illness and travel.',
      },
      {
        title: 'This House believes that public universities should be free for all students.',
        description: '',
      },
      {
        title: 'This House would ban homework in primary schools.',
        description: 'Applies to students under the age of 11.',
      },
    ].map((m) => ({ ...m, createdBy: organizer._id }))
  );

  const side = (user, s) => ({ user: user._id, side: s });
  const PRO = SIDES.PROPOSITION;
  const OPP = SIDES.OPPOSITION;

  const [practice, round1] = await Debate.create([
    {
      title: 'Practice Round: Homework',
      motion: m4._id,
      scheduledAt: daysFromNow(-14),
      venue: 'Room 204',
      judges: [j2._id, j3._id],
      participants: [side(p1, PRO), side(p5, PRO), side(p2, OPP), side(p6, OPP)],
      status: DEBATE_STATUS.COMPLETED,
      completedAt: daysFromNow(-14, 18),
      createdBy: organizer._id,
    },
    {
      title: 'Round 1: Social Media',
      motion: m1._id,
      scheduledAt: daysFromNow(-7),
      venue: 'Main Hall',
      judges: [j1._id, j2._id],
      participants: [side(p1, PRO), side(p2, PRO), side(p3, OPP), side(p4, OPP)],
      status: DEBATE_STATUS.COMPLETED,
      completedAt: daysFromNow(-7, 18),
      createdBy: organizer._id,
    },
    {
      title: 'Round 2: Compulsory Voting',
      motion: m2._id,
      scheduledAt: daysFromNow(2),
      venue: 'Main Hall',
      judges: [j1._id, j3._id],
      participants: [side(p1, PRO), side(p3, PRO), side(p2, OPP), side(p5, OPP)],
      createdBy: organizer._id,
    },
    {
      title: 'Round 3: Free Education',
      motion: m3._id,
      scheduledAt: daysFromNow(5),
      venue: 'Room 101',
      judges: [j2._id, j3._id],
      participants: [side(p4, PRO), side(p6, PRO), side(p1, OPP), side(p5, OPP)],
      createdBy: organizer._id,
    },
  ]);

  // [argument, rebuttal, delivery, feedback]
  const grade = (debate, judge, participant, [argument, rebuttal, delivery, feedback = '']) => ({
    debate: debate._id,
    judge: judge._id,
    participant: participant._id,
    argument,
    rebuttal,
    delivery,
    total: argument + rebuttal + delivery,
    feedback,
  });

  await Score.create([
    // Practice round (closed)
    grade(practice, j2, p1, [8, 7, 8, 'Clear structure and strong opening.']),
    grade(practice, j3, p1, [7, 7, 9]),
    grade(practice, j2, p5, [6, 6, 7, 'Good ideas, but rebuttals need to engage the strongest opposing point.']),
    grade(practice, j3, p5, [7, 6, 7]),
    grade(practice, j2, p2, [8, 8, 7]),
    grade(practice, j3, p2, [8, 9, 8, 'Excellent POIs and quick thinking.']),
    grade(practice, j2, p6, [5, 6, 6]),
    grade(practice, j3, p6, [6, 5, 7, 'Slow down and use more examples.']),
    // Round 1 (closed)
    grade(round1, j1, p1, [9, 8, 8, 'Great use of evidence on misinformation.']),
    grade(round1, j2, p1, [8, 8, 9]),
    grade(round1, j1, p2, [7, 8, 8]),
    grade(round1, j2, p2, [8, 7, 8, 'Solid rebuttals; watch your timing.']),
    grade(round1, j1, p3, [8, 7, 7]),
    grade(round1, j2, p3, [7, 8, 7, 'Persuasive framing of the opposition case.']),
    grade(round1, j1, p4, [6, 7, 8]),
    grade(round1, j2, p4, [7, 6, 8]),
  ]);

  console.log('\nSeed complete. Log in with any of these (password for all: %s)\n', PASSWORD);
  console.log('  organizer@demo.com');
  console.log('  judge1@demo.com, judge2@demo.com, judge3@demo.com');
  console.log('  participant1@demo.com ... participant6@demo.com\n');
}

seed()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
