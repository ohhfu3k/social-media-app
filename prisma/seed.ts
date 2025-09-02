import { PrismaClient, PostType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function randInt(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick<T>(arr: T[]) { return arr[randInt(0, arr.length - 1)]; }

async function main() {
  const users = [] as any[];
  for (let i = 1; i <= 10; i++) {
    const username = `demo${i}`;
    const email = `${username}@example.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, username, name: `Demo ${i}`, passwordHash: bcrypt.hashSync("password", 10), isActive: true, emailVerified: true, avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}` }
    });
    users.push(user);
  }

  // followers network
  for (const u of users) {
    const count = randInt(1, 4);
    const others = users.filter(x => x.id !== u.id);
    for (let j = 0; j < count; j++) {
      const v = pick(others);
      try { await prisma.follower.create({ data: { followerId: u.id, followingId: v.id } }); } catch {}
    }
  }

  // badges
  const badges = [
    await prisma.badge.upsert({ where: { code: 'founder' }, update: {}, create: { code: 'founder', label: 'Founder' } }),
    await prisma.badge.upsert({ where: { code: 'creator' }, update: {}, create: { code: 'creator', label: 'Creator' } }),
  ];
  for (const u of users) {
    try { await prisma.badgeOnUser.create({ data: { userId: u.id, badgeId: pick(badges).id } }); } catch {}
  }

  // posts + likes + comments
  const mediaImages = [
    'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=1200&auto=format&fit=crop'
  ];
  for (const u of users) {
    const postCount = randInt(3, 10);
    for (let k = 0; k < postCount; k++) {
      const isMedia = Math.random() < 0.5;
      const p = await prisma.post.create({ data: {
        authorId: u.id,
        type: isMedia ? 'IMAGE' as PostType : 'TEXT',
        text: isMedia ? null : `Hello from ${u.username} #${k}`,
        mediaUrl: isMedia ? pick(mediaImages) : null,
      }});
      const likeCount = randInt(0, 10);
      const commenters = [...users].sort(()=>Math.random()-0.5).slice(0, randInt(0, 5));
      for (let a = 0; a < likeCount; a++) {
        const who = pick(users);
        try { await prisma.like.create({ data: { postId: p.id, userId: who.id } }); } catch {}
      }
      for (const c of commenters) {
        await prisma.comment.create({ data: { postId: p.id, authorId: c.id, body: `Nice one, @${u.username}!` } });
      }
    }
  }

  // stories
  for (const u of users) {
    if (Math.random() < 0.7) {
      await prisma.story.create({ data: { authorId: u.id, mediaUrl: pick(mediaImages), expiresAt: new Date(Date.now() + 24*3600*1000), isHighlight: Math.random() < 0.3 } });
    }
  }
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
