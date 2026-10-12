import "dotenv/config";
import { definePrismaConfig } from "prisma/config";
import { defineConfig } from "@prisma/orm-postgres/config";
import { defineConfig as composer } from "@prisma/composer/config";
import { nextjsBuild } from "@prisma/composer/nextjs/control";
import { nodeBuild } from "@prisma/composer/node/control";
import { prismaCloud, prismaState } from "@prisma/composer-prisma-cloud/control";

export default definePrismaConfig({
  orm: defineConfig({
    contract: "src/prisma/contract.prisma",
    output: "src/prisma",
    db: { connection: process.env.DATABASE_URL },
  }),
  composer: composer({
    extensions: [prismaCloud({ region: "ap-southeast-1" }), nodeBuild(), nextjsBuild()],
    state: prismaState(),
  }),
});
