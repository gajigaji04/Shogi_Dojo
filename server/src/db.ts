import { PrismaClient } from "@prisma/client";

// Serverless functions can be re-invoked in the same warm process; without this
// caching pattern each invocation (and every dev hot-reload) would open a fresh
// connection pool, quickly exhausting Postgres's connection limit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
