import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

const testDatabaseUrl = process.env.PRISMA_TEST_DATABASE_URL;
if (testDatabaseUrl) process.env.DATABASE_URL = testDatabaseUrl;

test("Prisma 8 database and authentication compatibility", {
  skip: !testDatabaseUrl && "Set PRISMA_TEST_DATABASE_URL to an initialized test database",
}, async (t) => {
  const { prisma, timestamp, withDates } = await import("../src/lib/prisma");
  const { prismaAdapter } = await import("../src/lib/prisma-adapter");
  const suffix = randomUUID();
  const userIds: string[] = [];

  t.after(async () => {
    await prisma.orm.public.VerificationToken.where({ token: suffix }).deleteAll();
    for (const id of userIds) await prisma.orm.public.User.where({ id }).delete();
    await prisma.close();
  });

  const user = await prisma.orm.public.User.create({
    name: "Prisma upgrade test",
    email: `prisma-upgrade-${suffix}@example.invalid`,
    healingStreak: (related) => related.create({ currentStreak: 0, longestStreak: 0 }),
  }).then(withDates);
  userIds.push(user.id);

  await t.test("nested registration and timestamp defaults", async () => {
    assert(user.id);
    assert(user.createdAt instanceof Date);
    assert(user.updatedAt instanceof Date);
    const streak = await prisma.orm.public.HealingStreak.first({ userId: user.id }).then(withDates);
    assert.equal(streak?.currentStreak, 0);
    assert(streak?.lastActiveDate instanceof Date);
  });

  await t.test("date filtering, projections, pagination, and numeric counts", async () => {
    const mood = await prisma.orm.public.MoodEntry.create({
      userId: user.id, mood: 4, tags: ["peace"],
    }).then(withDates);
    const moods = await prisma.orm.public.MoodEntry
      .where({ userId: user.id })
      .where((row) => row.createdAt.gte(timestamp(new Date(Date.now() - 60_000))))
      .orderBy((row) => row.createdAt.desc())
      .offset(0).limit(1)
      .select("id", "mood", "note", "tags", "createdAt")
      .all().then(withDates);
    assert.equal(moods[0].id, mood.id);
    assert.deepEqual(moods[0].tags, ["peace"]);
    assert.equal(moods[0].createdAt.toISOString(), mood.createdAt.toISOString());
    assert.equal("userId" in moods[0], false);
    const total = await prisma.orm.public.MoodEntry.where({ userId: user.id })
      .aggregate((aggregate) => ({ count: aggregate.count() }));
    assert.equal(total.count, 1);
    const empty = await prisma.orm.public.MoodEntry.where({ userId: `missing-${suffix}` })
      .aggregate((aggregate) => ({ count: aggregate.count() }));
    assert.equal(empty.count, 0);
  });

  await t.test("chat relations preserve selected messages and count shapes", async () => {
    const session = await prisma.orm.public.ChatSession.include("messages")
      .create({ userId: user.id, title: "Migration test" }).then(withDates);
    assert.deepEqual(session.messages, []);
    await prisma.orm.public.ChatMessage.create({
      chatSessionId: session.id, role: "user", content: "Test message",
    });
    const sessions = await prisma.orm.public.ChatSession.where({ userId: user.id })
      .select("id", "title", "createdAt", "updatedAt")
      .include("messages", (related) => related.count())
      .all()
      .then((rows) => rows.map(({ messages, ...row }) => ({ ...row, _count: { messages } })))
      .then(withDates);
    assert.deepEqual(sessions[0]._count, { messages: 1 });
    const detail = await prisma.orm.public.ChatSession.where({ id: session.id, userId: user.id })
      .include("messages", (related) => related.orderBy((row) => row.createdAt.asc())
        .select("id", "role", "content", "createdAt"))
      .first().then(withDates);
    assert.equal(detail?.messages[0].content, "Test message");
    assert(detail?.messages[0].createdAt instanceof Date);
    assert.equal("chatSessionId" in detail!.messages[0], false);
    assert.equal(await prisma.orm.public.ChatSession.first({ id: session.id, userId: "another-user" }), null);
  });

  await t.test("community relation aggregates and compound reaction keys", async () => {
    const post = await prisma.orm.public.CommunityPost
      .include("user", (related) => related.select("name", "image"))
      .include("reactions", (related) => related.count())
      .create({ userId: user.id, content: "Test post", category: "growth" });
    assert.equal(post.user?.name, user.name);
    assert.equal(post.reactions, 0);
    const reaction = await prisma.orm.public.Reaction.create({
      userId: user.id, postId: post.id, type: "support",
    });
    const existing = await prisma.orm.public.Reaction.first({
      userId: user.id, postId: post.id, type: "support",
    });
    assert.equal(existing?.id, reaction.id);
    const listed = await prisma.orm.public.CommunityPost.where({ id: post.id })
      .include("reactions", (related) => related.combine({
        items: related.select("type", "userId"), total: related.count(),
      })).first();
    assert.deepEqual(listed?.reactions, {
      items: [{ type: "support", userId: user.id }], total: 1,
    });
    await prisma.orm.public.Reaction.where({ id: reaction.id }).delete();
    assert.equal(await prisma.orm.public.Reaction.first({ id: reaction.id }), null);
  });

  await t.test("updates, bulk subscription updates, and updatedAt policies", async () => {
    const previous = user.updatedAt.getTime();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const updated = await prisma.orm.public.User.where({ id: user.id })
      .update({ stripeCustomerId: suffix, isPremium: true }).then(withDates);
    assert(updated!.updatedAt.getTime() > previous);
    const count = await prisma.orm.public.User.where({ stripeCustomerId: suffix })
      .updateAndCount({ isPremium: false, subscriptionEnd: timestamp(new Date()) });
    assert.equal(count, 1);
    const current = await prisma.orm.public.User.first({ id: user.id }).then(withDates);
    assert.equal(current?.isPremium, false);
    assert(current?.subscriptionEnd instanceof Date);
  });

  await t.test("OAuth account linking, session dates, and single-use verification tokens", async () => {
    const email = `prisma-oauth-${suffix}@example.invalid`;
    const authUser = await prismaAdapter.createUser({
      email, name: "OAuth test", image: null, emailVerified: null,
    });
    userIds.push(authUser.id);
    assert.equal((await prismaAdapter.getUserByEmail(email))?.id, authUser.id);
    await prismaAdapter.linkAccount({
      userId: authUser.id, type: "oauth", provider: "google", providerAccountId: suffix,
    });
    assert.equal((await prismaAdapter.getUserByAccount({
      provider: "google", providerAccountId: suffix,
    }))?.id, authUser.id);
    const verifiedAt = new Date();
    const verified = await prismaAdapter.updateUser({ id: authUser.id, emailVerified: verifiedAt });
    assert.equal(verified.emailVerified?.toISOString(), verifiedAt.toISOString());
    const expires = new Date(Date.now() + 60_000);
    const session = await prismaAdapter.createSession({ sessionToken: suffix, userId: authUser.id, expires });
    assert.equal(session.expires.toISOString(), expires.toISOString());
    const sessionAndUser = await prismaAdapter.getSessionAndUser(suffix);
    assert.equal(sessionAndUser?.user.email, email);
    assert.equal(sessionAndUser?.session.expires.toISOString(), expires.toISOString());
    const newExpiry = new Date(expires.getTime() + 60_000);
    const updatedSession = await prismaAdapter.updateSession({ sessionToken: suffix, expires: newExpiry });
    assert.equal(updatedSession?.expires.toISOString(), newExpiry.toISOString());
    assert.equal(await prismaAdapter.updateSession({ sessionToken: "missing" }), null);
    await prismaAdapter.createVerificationToken({ identifier: email, token: suffix, expires });
    const used = await prismaAdapter.useVerificationToken({ identifier: email, token: suffix });
    assert.equal(used?.expires.toISOString(), expires.toISOString());
    assert.equal(await prismaAdapter.useVerificationToken({ identifier: email, token: suffix }), null);
    await prismaAdapter.deleteSession(suffix);
    assert.equal(await prismaAdapter.getSessionAndUser(suffix), null);
    await prismaAdapter.unlinkAccount({ provider: "google", providerAccountId: suffix });
    assert.equal(await prismaAdapter.getUserByAccount({ provider: "google", providerAccountId: suffix }), null);
    await assert.rejects(prismaAdapter.unlinkAccount({ provider: "google", providerAccountId: suffix }), /not found/);
    await assert.rejects(prismaAdapter.deleteSession(suffix), /not found/);
    await assert.rejects(prismaAdapter.deleteUser(`missing-${suffix}`), /not found/);
  });

  await t.test("built backend preserves authentication, pagination, reactions, and SDK responses", {
    skip: !process.env.PRISMA_TEST_API_URL && "Set PRISMA_TEST_API_URL to a backend using the test database",
  }, async () => {
    const baseUrl = process.env.PRISMA_TEST_API_URL!;
    let bearer = "";
    async function request(path: string, method = "GET", data?: object, status = 200) {
      const response = await fetch(`${baseUrl}/api${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      const body = await response.json();
      assert.equal(response.status, status, JSON.stringify(body));
      return body;
    }
    const email = `prisma-api-${suffix}@example.invalid`;
    const password = randomUUID();
    const registered = await request("/auth/register", "POST", {
      name: "HTTP test", email, password,
    }, 201);
    userIds.push(registered.user.id);
    bearer = registered.token;
    await request("/auth/register", "POST", { email, password }, 409);
    await request("/auth/login", "POST", { email, password: "wrong" }, 401);
    const login = await request("/auth/login", "POST", { email, password });
    bearer = login.token;
    const currentUser = await request("/auth/me");
    assert.equal(currentUser.email, email);
    assert.match(currentUser.createdAt, /^\d{4}-\d{2}-\d{2}T.*Z$/);

    const mood = await request("/mood", "POST", { mood: 4, tags: ["peace"] }, 201);
    const moods = await request("/mood?days=1");
    assert.equal(moods[0].id, mood.id);
    assert.deepEqual(moods[0].tags, ["peace"]);
    assert.equal(moods[0].createdAt, mood.createdAt);
    assert.equal("userId" in moods[0], false);
    const dashboard = await request("/dashboard");
    assert.equal(dashboard.totalMoods, 1);
    assert.equal(dashboard.avgMood, 4);
    assert.equal(dashboard.currentStreak, 0);

    await request("/journal", "POST", {
      prompt: "Testing", content: "Migration test", category: suffix,
    }, 201);
    const journals = await request("/journal?page=1&limit=1");
    assert.equal(journals.total, 1);
    assert.equal(journals.entries.length, 1);

    const post = await request("/community", "POST", {
      content: "HTTP test post", category: suffix, isAnonymous: true,
    }, 201);
    assert.deepEqual(post._count, { reactions: 0 });
    assert.equal((await request(`/community/${post.id}/react`, "POST", { type: "support" }, 201)).action, "added");
    const posts = await request(`/community?category=${suffix}&page=1&limit=1`);
    assert.equal(posts.total, 1);
    assert.equal(posts.totalPages, 1);
    assert.deepEqual(posts.posts[0].user, { name: "Anonymous", image: null });
    assert.deepEqual(posts.posts[0]._count, { reactions: 1 });
    assert.deepEqual(posts.posts[0].reactions, [{ type: "support", _count: 1, userReacted: true }]);
    assert.equal((await request(`/community/${post.id}/react`, "POST", { type: "support" })).action, "removed");

    const chat = await prisma.orm.public.ChatSession.create({ userId: currentUser.id, title: "HTTP test" });
    await prisma.orm.public.ChatMessage.create({ chatSessionId: chat.id, role: "user", content: "Hello" });
    const chats = await request("/chat");
    assert.equal(chats[0].id, chat.id);
    assert.deepEqual(chats[0]._count, { messages: 1 });
    const chatDetail = await request(`/chat/${chat.id}`);
    assert.equal(chatDetail.messages[0].content, "Hello");
    await request(`/chat/${chat.id}`, "DELETE");
    await request(`/chat/${chat.id}`, "GET", undefined, 404);

    const key = await request("/apikeys", "POST", { name: "Migration test" }, 201);
    const masked = await request("/apikeys");
    assert.equal(masked[0].key, `hm_...${key.key.slice(-8)}`);
    const loginToken = bearer;
    bearer = key.key;
    const widget = await request("/sdk/widget");
    assert.equal(widget.recentMoods[0].mood, 4);
    assert.equal(widget.user.name, "HTTP test");
    await request("/sdk/mood", "POST", { mood: 5, tags: [] }, 201);
    assert.equal((await request("/sdk/mood")).length, 2);
    bearer = loginToken;
    await request(`/apikeys?id=${key.id}`, "DELETE");
    bearer = key.key;
    await request("/sdk/widget", "GET", undefined, 401);
  });
});
