import { PrismaClient } from "@prisma/client";
import { AFFIRMATIONS, HEALING_EXERCISES } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed affirmations
  for (const content of AFFIRMATIONS) {
    const categories = ["self-love", "healing", "strength", "growth", "peace"];
    const category = categories[Math.floor(Math.random() * categories.length)];
    await prisma.affirmation.upsert({
      where: { id: content.slice(0, 20).replace(/\s/g, "-").toLowerCase() },
      update: {},
      create: {
        id: content.slice(0, 20).replace(/\s/g, "-").toLowerCase(),
        content,
        category,
      },
    });
  }

  // Seed exercises
  for (const exercise of HEALING_EXERCISES) {
    await prisma.exercise.upsert({
      where: { id: exercise.id },
      update: {},
      create: {
        id: exercise.id,
        title: exercise.title,
        description: exercise.description,
        category: exercise.category,
        duration: exercise.duration,
        steps: exercise.steps,
        isPremium: exercise.isPremium,
      },
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
