import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

// Create connection
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// Constants
const PASSWORD = '12345678';
const SALT_ROUNDS = 10;
const NUM_PAINTERS = 50;
const NUM_CUSTOMERS = 20;
const MIN_SLOTS_PER_PAINTER = 5;
const MAX_SLOTS_PER_PAINTER = 10;
const MIN_BOOKINGS = 30;
const MAX_BOOKINGS = 50;
const DAYS_AHEAD = 30;

// Helper function to generate random date within business hours
function getRandomBusinessDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  // Set to random business hour between 8 AM and 6 PM
  const hour = 8 + Math.floor(Math.random() * 10); // 8-17 (5 PM)
  date.setHours(hour, 0, 0, 0);
  return date;
}

// Helper function to get end time (1-4 hours after start)
function getEndTime(startTime: Date): Date {
  const endTime = new Date(startTime);
  const duration = 1 + Math.floor(Math.random() * 3); // 1-3 hours
  endTime.setHours(startTime.getHours() + duration);
  return endTime;
}

// Helper function to get random element from array
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function seedUsers() {
  console.log('🎨 Seeding painters...');
  const hashedPassword = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  const painters: (typeof schema.users.$inferInsert)[] = [];
  for (let i = 1; i <= NUM_PAINTERS; i++) {
    painters.push({
      email: `painter${i}@example.com`,
      password: hashedPassword,
      name: `Painter ${i}`,
      role: 'painter' as const,
    });
  }

  const insertedPainters = await db
    .insert(schema.users)
    .values(painters)
    .returning();

  console.log(`✅ Created ${insertedPainters.length} painters`);

  console.log('👥 Seeding customers...');
  const customers: (typeof schema.users.$inferInsert)[] = [];
  for (let i = 1; i <= NUM_CUSTOMERS; i++) {
    customers.push({
      email: `customer${i}@example.com`,
      password: hashedPassword,
      name: `Customer ${i}`,
      role: 'customer' as const,
    });
  }

  const insertedCustomers = await db
    .insert(schema.users)
    .values(customers)
    .returning();

  console.log(`✅ Created ${insertedCustomers.length} customers`);

  return { painters: insertedPainters, customers: insertedCustomers };
}

async function seedAvailability(painters: any[]) {
  console.log('📅 Seeding availability slots...');

  const availabilitySlots: (typeof schema.availability.$inferInsert)[] = [];

  for (const painter of painters) {
    const numSlots =
      MIN_SLOTS_PER_PAINTER +
      Math.floor(
        Math.random() * (MAX_SLOTS_PER_PAINTER - MIN_SLOTS_PER_PAINTER + 1),
      );

    for (let i = 0; i < numSlots; i++) {
      const daysFromNow = Math.floor(Math.random() * DAYS_AHEAD);
      const startTime = getRandomBusinessDate(daysFromNow);
      const endTime = getEndTime(startTime);

      availabilitySlots.push({
        painterId: painter.id,
        startTime,
        endTime,
      });
    }
  }

  const insertedSlots = await db
    .insert(schema.availability)
    .values(availabilitySlots)
    .returning();

  console.log(`✅ Created ${insertedSlots.length} availability slots`);

  return insertedSlots;
}

async function seedBookings(
  painters: any[],
  customers: any[],
  availabilitySlots: any[],
) {
  console.log('📝 Seeding bookings...');

  const numBookings =
    MIN_BOOKINGS +
    Math.floor(Math.random() * (MAX_BOOKINGS - MIN_BOOKINGS + 1));

  const bookings: (typeof schema.bookings.$inferInsert)[] = [];
  const statuses: Array<'confirmed' | 'completed' | 'cancelled'> = [
    'confirmed',
    'completed',
    'cancelled',
  ];

  // Group availability slots by painter for easier lookup
  const slotsByPainter = new Map<string, any[]>();
  for (const slot of availabilitySlots) {
    if (!slotsByPainter.has(slot.painterId)) {
      slotsByPainter.set(slot.painterId, []);
    }
    slotsByPainter.get(slot.painterId)!.push(slot);
  }

  for (let i = 0; i < numBookings; i++) {
    // Pick random painter and customer
    const painter = getRandomElement(painters);
    const customer = getRandomElement(customers);

    // Get available slots for this painter
    const painterSlots = slotsByPainter.get(painter.id) || [];

    if (painterSlots.length === 0) {
      continue; // Skip if no slots available
    }

    // Pick random slot
    const slot = getRandomElement(painterSlots);

    // Create booking within the availability slot
    const slotDuration = slot.endTime.getTime() - slot.startTime.getTime();
    const maxOffset = slotDuration / 2; // Book within first half of slot
    const offset = Math.floor(Math.random() * maxOffset);

    const startTime = new Date(slot.startTime.getTime() + offset);
    const endTime = getEndTime(startTime);

    // Ensure end time doesn't exceed slot end time
    if (endTime > slot.endTime) {
      endTime.setTime(slot.endTime.getTime());
    }

    // Random status with weighted distribution
    // 60% confirmed, 30% completed, 10% cancelled
    const rand = Math.random();
    let status: 'confirmed' | 'completed' | 'cancelled';
    if (rand < 0.6) {
      status = 'confirmed';
    } else if (rand < 0.9) {
      status = 'completed';
    } else {
      status = 'cancelled';
    }

    bookings.push({
      customerId: customer.id,
      painterId: painter.id,
      startTime,
      endTime,
      status,
    });
  }

  if (bookings.length > 0) {
    const insertedBookings = await db
      .insert(schema.bookings)
      .values(bookings)
      .returning();

    console.log(`✅ Created ${insertedBookings.length} bookings`);

    // Show status breakdown
    const statusCount = insertedBookings.reduce(
      (acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log('   Status breakdown:', statusCount);
  } else {
    console.log('⚠️  No bookings created');
  }
}

async function main() {
  console.log('🚀 Starting database seeding...\n');

  try {
    // Seed users
    const { painters, customers } = await seedUsers();
    console.log('');

    // Seed availability
    const availabilitySlots = await seedAvailability(painters);
    console.log('');

    // Seed bookings
    await seedBookings(painters, customers, availabilitySlots);
    console.log('');

    console.log('✨ Seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - ${painters.length} painters`);
    console.log(`   - ${customers.length} customers`);
    console.log(`   - ${availabilitySlots.length} availability slots`);
    console.log(`   - Password for all users: ${PASSWORD}`);
    console.log('');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
