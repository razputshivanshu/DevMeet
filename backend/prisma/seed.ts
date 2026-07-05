/* eslint-disable no-console */
import { PrismaClient, OrgRole, ChannelType, KanbanStatus, MessageType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding DevMeet database...');

  // ---- Users ----
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@devmeet.io' },
    update: {},
    create: {
      email: 'owner@devmeet.io',
      username: 'owner',
      name: 'Ada Lovelace',
      password: passwordHash,
      bio: 'Founding engineer at DevMeet',
      emailVerified: true,
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@devmeet.io' },
    update: {},
    create: {
      email: 'alice@devmeet.io',
      username: 'alice',
      name: 'Alice Turing',
      password: passwordHash,
      emailVerified: true,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@devmeet.io' },
    update: {},
    create: {
      email: 'bob@devmeet.io',
      username: 'bob',
      name: 'Bob Hopper',
      password: passwordHash,
      emailVerified: true,
    },
  });

  // ---- Organization ----
  const org = await prisma.organization.upsert({
    where: { slug: 'devmeet-hq' },
    update: {},
    create: {
      name: 'DevMeet HQ',
      slug: 'devmeet-hq',
      description: 'The official DevMeet workspace',
      createdById: owner.id,
      members: {
        create: [
          { userId: owner.id, role: OrgRole.OWNER },
          { userId: alice.id, role: OrgRole.ADMIN },
          { userId: bob.id, role: OrgRole.MEMBER },
        ],
      },
    },
  });

  // ---- Team ----
  const engTeam = await prisma.team.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'Engineering' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Engineering',
      description: 'Product engineering team',
      createdById: owner.id,
      members: {
        create: [
          { userId: owner.id, role: 'LEAD' },
          { userId: alice.id, role: 'MEMBER' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // ---- Channels ----
  const general = await prisma.channel.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'general' } },
    update: {},
    create: {
      organizationId: org.id,
      teamId: engTeam.id,
      name: 'general',
      topic: 'Company-wide announcements',
      type: ChannelType.PUBLIC,
      createdById: owner.id,
      members: {
        create: [{ userId: owner.id }, { userId: alice.id }, { userId: bob.id }],
      },
    },
  });

  await prisma.channel.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'random' } },
    update: {},
    create: {
      organizationId: org.id,
      teamId: engTeam.id,
      name: 'random',
      topic: 'Off-topic chatter',
      type: ChannelType.PUBLIC,
      createdById: owner.id,
      members: {
        create: [{ userId: owner.id }, { userId: alice.id }, { userId: bob.id }],
      },
    },
  });

  // ---- Sample messages ----
  const existingMsgs = await prisma.message.count({ where: { channelId: general.id } });
  if (existingMsgs === 0) {
    await prisma.message.createMany({
      data: [
        {
          channelId: general.id,
          userId: owner.id,
          content: 'Welcome to DevMeet! 🎉',
          type: MessageType.TEXT,
        },
        {
          channelId: general.id,
          userId: alice.id,
          content: 'Excited to be here!',
          type: MessageType.TEXT,
        },
        {
          channelId: general.id,
          userId: bob.id,
          content: 'Let’s ship something great.',
          type: MessageType.TEXT,
        },
      ],
    });
  }

  // ---- Kanban board ----
  const board = await prisma.kanbanBoard.findFirst({ where: { teamId: engTeam.id } });
  if (!board) {
    await prisma.kanbanBoard.create({
      data: {
        teamId: engTeam.id,
        name: 'Sprint 1',
        description: 'Initial sprint',
        cards: {
          create: [
            {
              title: 'Set up CI/CD',
              status: KanbanStatus.TODO,
              position: 0,
              createdById: owner.id,
              assigneeId: alice.id,
            },
            {
              title: 'Design database schema',
              status: KanbanStatus.IN_PROGRESS,
              position: 0,
              createdById: owner.id,
              assigneeId: owner.id,
            },
            {
              title: 'Kick-off meeting',
              status: KanbanStatus.DONE,
              position: 0,
              createdById: owner.id,
              assigneeId: bob.id,
            },
          ],
        },
      },
    });
  }

  console.log('✅ Seeding complete.');
  console.log('   Login: owner@devmeet.io / Password123!');
  console.log('   Login: alice@devmeet.io / Password123!');
  console.log('   Login: bob@devmeet.io   / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
