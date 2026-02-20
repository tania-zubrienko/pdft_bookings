/**
 * Seed script for development
 * Run with: npx ts-node --esm scripts/seed.ts
 *
 * This script creates sample classes in Firestore for testing
 */

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize with service account for local development
// Download from Firebase Console > Project Settings > Service Accounts
const serviceAccount = require('../serviceAccountKey.json') as ServiceAccount;

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const sampleClasses = [
  {
    title: 'Beginner Salsa',
    description:
      "Learn the fundamentals of salsa dancing. Perfect for those with no prior experience. We'll cover basic steps, timing, and partner work.",
    instructorId: 'instructor-1',
    instructorName: 'Maria Rodriguez',
    scheduledAt: Timestamp.fromDate(
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    ), // 2 days from now
    duration: 60,
    capacity: 20,
    enrolledCount: 5,
    price: 2500, // $25.00
    active: true,
    location: 'Studio A',
  },
  {
    title: 'Hip Hop Fundamentals',
    description:
      'Get grooving with hip hop basics! Learn iconic moves, rhythm patterns, and freestyle techniques in a fun, energetic environment.',
    instructorId: 'instructor-2',
    instructorName: 'Marcus Johnson',
    scheduledAt: Timestamp.fromDate(
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    ), // 3 days from now
    duration: 75,
    capacity: 15,
    enrolledCount: 12,
    price: 3000, // $30.00
    active: true,
    location: 'Studio B',
  },
  {
    title: 'Contemporary Dance',
    description:
      'Express yourself through contemporary dance. This class focuses on fluid movement, improvisation, and emotional expression.',
    instructorId: 'instructor-3',
    instructorName: 'Sarah Chen',
    scheduledAt: Timestamp.fromDate(
      new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    ), // 4 days from now
    duration: 90,
    capacity: 12,
    enrolledCount: 8,
    price: 3500, // $35.00
    active: true,
    location: 'Studio A',
  },
  {
    title: 'Advanced Bachata',
    description:
      'Take your bachata to the next level with advanced patterns, body movement, and musicality. Prior bachata experience required.',
    instructorId: 'instructor-1',
    instructorName: 'Maria Rodriguez',
    scheduledAt: Timestamp.fromDate(
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    ), // 5 days from now
    duration: 60,
    capacity: 16,
    enrolledCount: 16, // Full class
    price: 2500, // $25.00
    active: true,
    location: 'Studio A',
  },
  {
    title: 'Ballet Basics',
    description:
      'Introduction to classical ballet technique. Learn posture, positions, and basic movements in a supportive environment.',
    instructorId: 'instructor-4',
    instructorName: 'Elena Petrova',
    scheduledAt: Timestamp.fromDate(
      new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    ), // 6 days from now
    duration: 60,
    capacity: 10,
    enrolledCount: 3,
    price: 2800, // $28.00
    active: true,
    location: 'Studio C',
  },
  {
    title: 'Zumba Fitness',
    description:
      'Dance your way to fitness! High-energy workout combining Latin and international music with dance moves.',
    instructorId: 'instructor-5',
    instructorName: 'Jessica Martinez',
    scheduledAt: Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ), // 7 days from now
    duration: 45,
    capacity: 30,
    enrolledCount: 18,
    price: 1500, // $15.00
    active: true,
    location: 'Main Hall',
  },
];

async function seedClasses() {
  console.log('Seeding classes...');

  const batch = db.batch();

  for (const classData of sampleClasses) {
    const classRef = db.collection('classes').doc();
    batch.set(classRef, {
      ...classData,
      createdAt: Timestamp.now(),
    });
    console.log(`  - ${classData.title}`);
  }

  await batch.commit();
  console.log(`\nSuccessfully seeded ${sampleClasses.length} classes!`);
}

seedClasses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding classes:', error);
    process.exit(1);
  });
