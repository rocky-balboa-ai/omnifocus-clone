import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Rocky sample tasks...');

  // Create sample tasks for Rocky
  const tasks = [
    {
      title: "Renew Fred's passport",
      note: "Check expiry date and start renewal process. Need to book appointment at passport office.",
      managedBy: 'rocky',
      rockyStatus: 'in_progress',
      category: 'documents',
      priority: 'high',
      activityLog: [
        {
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          author: 'rocky',
          note: 'Started tracking passport renewal. Current passport expires in 3 months.',
        },
        {
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          author: 'rocky',
          note: 'Researched renewal requirements. Need 2 photos and application form.',
        },
      ],
    },
    {
      title: 'Pay Salma (maid) — February',
      note: 'Monthly payment for household help. Amount: AED 2,500',
      managedBy: 'rocky',
      rockyStatus: 'todo',
      category: 'household',
      priority: 'high',
      dueDate: new Date('2026-02-05T00:00:00.000Z'),
      activityLog: [
        {
          timestamp: new Date().toISOString(),
          author: 'rocky',
          note: 'Set up reminder for monthly payment.',
        },
      ],
    },
    {
      title: 'DEWA bill payment',
      note: 'Dubai Electricity and Water Authority bill. Awaiting final bill amount.',
      managedBy: 'rocky',
      rockyStatus: 'waiting_external',
      category: 'bills',
      priority: 'medium',
      activityLog: [
        {
          timestamp: new Date().toISOString(),
          author: 'rocky',
          note: 'Bill not yet issued. Will check again in 2 days.',
        },
      ],
    },
    {
      title: 'Book dentist for Anthony',
      note: 'Regular checkup appointment. Need to confirm preferred dates with Fred.',
      managedBy: 'rocky',
      rockyStatus: 'waiting_on_fred',
      category: 'family',
      priority: 'medium',
      activityLog: [
        {
          timestamp: new Date().toISOString(),
          author: 'rocky',
          note: 'Found 3 available slots next week. Waiting for Fred to confirm which date works.',
        },
      ],
    },
    {
      title: 'Research Tesla Optimus availability',
      note: 'Check on pre-order status and expected delivery timeline for Tesla humanoid robot.',
      managedBy: 'rocky',
      rockyStatus: 'in_progress',
      category: 'other',
      priority: 'low',
      activityLog: [
        {
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          author: 'rocky',
          note: 'Initial research: Optimus Gen 2 announced. Production timeline unclear.',
        },
        {
          timestamp: new Date().toISOString(),
          author: 'rocky',
          note: 'Signed up for Tesla newsletter for Optimus updates.',
        },
      ],
    },
    {
      title: 'Etisalat internet upgrade',
      note: 'Current plan is 500Mbps. Check if 1Gbps is available in our area.',
      managedBy: 'rocky',
      rockyStatus: 'todo',
      category: 'bills',
      priority: 'low',
      activityLog: [],
    },
    {
      title: 'Schedule car service - Range Rover',
      note: 'Annual service due. Contact Al Tayer Motors.',
      managedBy: 'rocky',
      rockyStatus: 'todo',
      category: 'errands',
      priority: 'medium',
      dueDate: new Date('2026-02-15T00:00:00.000Z'),
      activityLog: [],
    },
    {
      title: 'Renew gym membership',
      note: 'Fitness First membership expires end of Feb.',
      managedBy: 'fred',
      rockyStatus: 'inbox',
      category: 'health',
      priority: null,
      activityLog: [],
    },
  ];

  for (const task of tasks) {
    await prisma.action.create({
      data: {
        title: task.title,
        note: task.note,
        managedBy: task.managedBy,
        rockyStatus: task.rockyStatus,
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate,
        activityLog: task.activityLog,
        isInbox: true,
      },
    });
    console.log(`  Created: ${task.title}`);
  }

  // Create the Rocky's Queue perspective
  const existingPerspective = await prisma.perspective.findFirst({
    where: { name: "Rocky's Queue" },
  });

  if (!existingPerspective) {
    await prisma.perspective.create({
      data: {
        name: "Rocky's Queue",
        icon: 'robot',
        isBuiltIn: false,
        position: 100,
        filterRules: {
          managedBy: 'rocky',
        },
        groupBy: 'rockyStatus',
      },
    });
    console.log("  Created: Rocky's Queue perspective");
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
