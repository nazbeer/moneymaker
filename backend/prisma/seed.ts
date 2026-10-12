import { prisma } from "../src/lib/prisma";
import { AFFIRMATIONS, HEALING_EXERCISES } from "../src/lib/constants";

async function main() {
  console.log("Seeding database...");

  // Seed affirmations
  for (const content of AFFIRMATIONS) {
    const categories = ["self-love", "healing", "strength", "growth", "peace"];
    const category = categories[Math.floor(Math.random() * categories.length)];
    await prisma.orm.public.Affirmation
      .upsert({ conflictOn: { id: content.slice(0, 20).replace(/\s/g, "-").toLowerCase() }, create: { id: content.slice(0, 20).replace(/\s/g, "-").toLowerCase(), content, category }, update: {} });
  }

  // Seed exercises
  for (const exercise of HEALING_EXERCISES) {
    await prisma.orm.public.Exercise
      .upsert({ conflictOn: { id: exercise.id }, create: { id: exercise.id, title: exercise.title, description: exercise.description, category: exercise.category, duration: exercise.duration, steps: exercise.steps, isPremium: exercise.isPremium }, update: {} });
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.close();
  });
