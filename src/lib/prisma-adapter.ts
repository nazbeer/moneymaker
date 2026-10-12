import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import { prisma, timestamp, withDates } from "./prisma";

function adapterUser(user: {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  emailVerified: Date | null;
}): AdapterUser {
  if (!user.email) throw new Error("An authentication user must have an email address");
  return { ...user, email: user.email };
}

export const prismaAdapter = {
  async createUser(data: Omit<AdapterUser, "id">) {
    const user = await prisma.orm.public.User
      .create({
        ...data,
        emailVerified: data.emailVerified ? timestamp(data.emailVerified) : null,
      })
      .then(withDates);
    return adapterUser(user);
  },
  async getUser(id) {
    const user = await prisma.orm.public.User
      .first({ id })
      .then(withDates);
    return user ? adapterUser(user) : null;
  },
  async getUserByEmail(email) {
    const user = await prisma.orm.public.User
      .first({ email })
      .then(withDates);
    return user ? adapterUser(user) : null;
  },
  async getUserByAccount({ provider, providerAccountId }) {
    const account = await prisma.orm.public.Account
      .where({ provider, providerAccountId })
      .include("user")
      .first()
      .then(withDates);
    return account?.user ? adapterUser(account.user) : null;
  },
  async updateUser({ id, emailVerified, ...data }) {
    const user = await prisma.orm.public.User
      .where({ id })
      .update({
        ...data,
        ...(emailVerified !== undefined
          ? { emailVerified: emailVerified ? timestamp(emailVerified) : null }
          : {}),
      })
      .then(withDates);
    if (!user) throw new Error("Authentication user not found for update");
    return adapterUser(user);
  },
  async deleteUser(id) {
    const user = await prisma.orm.public.User
      .where({ id })
      .delete();
    if (!user) throw new Error("Authentication user not found for delete");
  },
  async linkAccount(data: AdapterAccount) {
    await prisma.orm.public.Account
      .create(data);
  },
  async unlinkAccount({ provider, providerAccountId }: Pick<AdapterAccount, "provider" | "providerAccountId">) {
    const account = await prisma.orm.public.Account
      .where({ provider, providerAccountId })
      .delete();
    if (!account) throw new Error("Authentication account not found for unlink");
  },
  async createSession(data) {
    return prisma.orm.public.Session
      .create({
        ...data,
        expires: timestamp(data.expires),
      })
      .then(withDates);
  },
  async getSessionAndUser(sessionToken) {
    const result = await prisma.orm.public.Session
      .where({ sessionToken })
      .include("user")
      .first()
      .then(withDates);
    if (!result?.user) return null;
    const { user, ...session } = result;
    return { session, user: adapterUser(user) };
  },
  async updateSession({ sessionToken, expires, ...data }) {
    return prisma.orm.public.Session
      .where({ sessionToken })
      .update({
        ...data,
        ...(expires ? { expires: timestamp(expires) } : {}),
      })
      .then(withDates);
  },
  async deleteSession(sessionToken) {
    const session = await prisma.orm.public.Session
      .where({ sessionToken })
      .delete()
      .then(withDates);
    if (!session) throw new Error("Authentication session not found for delete");
    return session;
  },
  async createVerificationToken(data) {
    return prisma.orm.public.VerificationToken
      .create({
        ...data,
        expires: timestamp(data.expires),
      })
      .then(withDates);
  },
  async useVerificationToken({ identifier, token }) {
    const deleted = await prisma.orm.public.VerificationToken
      .where({ identifier, token })
      .deleteAll()
      .then(withDates);
    return deleted[0] ?? null;
  },
} satisfies Adapter;
