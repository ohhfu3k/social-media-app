import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma basic CRUD', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates and reads a user', async () => {
    const email = `test_${Math.random().toString(36).slice(2)}@example.com`;
    const u = await prisma.user.create({ data: { name: 'T User', email } });
    const f = await prisma.user.findUnique({ where: { id: u.id } });
    expect(f?.email).toBe(email);
    await prisma.user.delete({ where: { id: u.id } });
  });

  it('upserts a profile JSON blobs', async () => {
    const u = await prisma.user.create({ data: { name: 'P User' } });
    const p1 = await prisma.profile.upsert({ where: { userId: u.id }, create: { userId: u.id, username: 'puser', postsJson: [] }, update: {} });
    expect(p1.userId).toBe(u.id);
    const posts = [{ postId: 'p1', contentType: 'text', contentUrl: '', caption: 'hi', likes: 0, comments: [], createdAt: new Date().toISOString() }];
    const p2 = await prisma.profile.update({ where: { userId: u.id }, data: { postsJson: posts } });
    expect(Array.isArray((p2 as any).postsJson)).toBe(true);
    await prisma.profile.delete({ where: { id: p1.id } });
    await prisma.user.delete({ where: { id: u.id } });
  });

  it('creates and queries messages by convo', async () => {
    const convoId = `c_${Math.random().toString(36).slice(2)}`;
    await prisma.message.create({ data: { convoId, participants: ['a','b'], text: 'hello' } });
    await prisma.message.create({ data: { convoId, participants: ['a','b'], text: 'world' } });
    const list = await prisma.message.findMany({ where: { convoId }, orderBy: { createdAt: 'asc' } });
    expect(list.length).toBeGreaterThanOrEqual(2);
    await prisma.message.deleteMany({ where: { convoId } });
  });
});
