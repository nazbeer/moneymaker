import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import type { TimestampString } from "@prisma/orm-postgres/target/codec-types";
import type { Contract } from "../prisma/contract";
import contractJson from "../prisma/contract.json";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma8?: ReturnType<typeof postgres<Contract>>;
};

export const prisma = globalForPrisma.prisma8 ?? postgres<Contract>({
  contractJson,
  url: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma8 = prisma;

export function timestamp(date: Date): TimestampString<3> {
  return date.toISOString().slice(0, -1).replace("T", " ") as TimestampString<3>;
}

type TimestampField = "createdAt" | "updatedAt" | "emailVerified" |
  "subscriptionEnd" | "lastActiveDate" | "expires";

type WithDates<T> = T extends Date
  ? Date
  : T extends readonly (infer Item)[]
  ? WithDates<Item>[]
  : T extends object
    ? { [Key in keyof T]: Key extends TimestampField
        ? T[Key] extends string | null ? Date | Extract<T[Key], null> : T[Key]
        : WithDates<T[Key]> }
    : T;

// Prisma 8 reads the existing timestamp-without-time-zone columns as strings.
// Preserve the UTC Date values (and ISO JSON responses) used by the application.
export function withDates<T>(value: T): WithDates<T> {
  function convert(input: unknown): unknown {
    if (Array.isArray(input)) return input.map(convert);
    if (input === null || typeof input !== "object" || input instanceof Date) return input;
    return Object.fromEntries(Object.entries(input).map(([key, item]) => {
      if (typeof item === "string" && [
        "createdAt", "updatedAt", "emailVerified", "subscriptionEnd", "lastActiveDate", "expires",
      ].includes(key)) {
        const date = new Date(item.replace(" ", "T") + "Z");
        if (Number.isNaN(date.getTime())) throw new Error(`Invalid database timestamp for ${key}`);
        return [key, date];
      }
      return [key, convert(item)];
    }));
  }
  return convert(value) as WithDates<T>;
}
