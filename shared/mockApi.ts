export type SearchItem =
  | { type: "user"; id: string; name: string; username: string; avatar: string; energy: number }
  | { type: "post"; id: string; title: string; image: string; energy: number }
  | { type: "hashtag"; id: string; tag: string; count: number };

export type Message = { id: string; author: string; text: string; time: string };
export type Conversation = { id: string; name: string; participants: string[]; avatar: string; online: boolean };
export type NotificationItem = { id: string; kind: "star" | "whisper" | "energy" | "system"; text: string; read: boolean; time: string };
export type Post = { id: string; title: string; image?: string; video?: string; body: string; energy: number; author: string };
export type LeaderboardEntry = { id: string; name: string; avatar: string; score: number };

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export async function fetchSearchResults(q: string, page: number): Promise<SearchItem[]> {
  await delay(400);
  const items: SearchItem[] = [];
  for (let i = 0; i < 12; i++) {
    const t = ["user", "post", "hashtag"][rand(0, 2)] as SearchItem["type"];
    if (t === "user")
      items.push({ type: "user", id: `${page}-u${i}`, name: `Star ${page}-${i}`, username: `user${page}${i}`, avatar: `https://i.pravatar.cc/150?img=${rand(1, 70)}`, energy: rand(10, 99) });
    else if (t === "post")
      items.push({ type: "post", id: `${page}-p${i}`, title: `Nebula ${page}-${i}`, image: `https://picsum.photos/seed/${page}-${i}/600/400`, energy: rand(10, 99) });
    else items.push({ type: "hashtag", id: `${page}-h${i}`, tag: ["#galaxy", "#dragon", "#nebula", "#orion"][rand(0, 3)], count: rand(100, 5000) });
  }
  return items;
}

export async function fetchConversations(): Promise<Conversation[]> {
  await delay(300);
  return Array.from({ length: 12 }).map((_, i) => ({
    id: `c${i + 1}`,
    name: i % 3 === 0 ? `Nebula Group ${i + 1}` : `User ${i + 1}`,
    participants: i % 3 === 0 ? ["Nova", "Orion", "Lyra"] : ["You", `User ${i + 1}`],
    avatar: `https://i.pravatar.cc/150?img=${rand(1, 70)}`,
    online: Math.random() > 0.5,
  }));
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  await delay(300);
  return Array.from({ length: 18 }).map((_, i) => ({
    id: `${conversationId}-m${i}`,
    author: i % 2 ? "You" : "Nova",
    text: i % 5 === 0 ? "Look at this starlink!" : "✨",
    time: `${rand(1, 12)}:${rand(10, 59)} pm`,
  }));
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  await delay(300);
  return Array.from({ length: 24 }).map((_, i) => ({
    id: `n${i}`,
    kind: (['star','whisper','energy','system'] as const)[rand(0,3)],
    text: i % 2 ? "Star linked your post" : "You received energy",
    read: Math.random() > 0.6,
    time: `${rand(1,23)}h`,
  }));
}

export async function fetchTrending(): Promise<Post[]> {
  await delay(350);
  return Array.from({ length: 12 }).map((_, i) => ({
    id: `t${i}`,
    title: `Crown of Orion ${i}`,
    image: `https://picsum.photos/seed/trend-${i}/800/600`,
    body: "Trending across the Orion Arm.",
    energy: rand(10, 99),
    author: "Nova",
  }));
}

export async function fetchPost(id: string): Promise<Post> {
  await delay(250);
  return {
    id,
    title: `Post ${id}`,
    image: `https://picsum.photos/seed/post-${id}/900/700`,
    body: "A detailed journey through the nebula.",
    energy: rand(10, 99),
    author: "Nova",
  };
}

export async function fetchLeaderboard(kind: "energy" | "badges" | "posts"): Promise<LeaderboardEntry[]> {
  await delay(300);
  return Array.from({ length: 20 }).map((_, i) => ({ id: `${kind}-${i}`, name: `User ${i + 1}`, avatar: `https://i.pravatar.cc/150?img=${rand(1,70)}`, score: rand(100, 9999) }));
}
