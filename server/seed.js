import "dotenv/config";
import mongoose from "mongoose";
import { Topic } from "./models.js";
import { syllabusData } from "./syllabusData.js";

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set. Copy .env.example to .env first.");
  await mongoose.connect(uri);
  console.log("Connected. Seeding SSC CGL syllabus...");

  await Topic.deleteMany({});
  await Topic.insertMany(syllabusData);

  console.log(`Seeded ${syllabusData.length} topics across 4 subjects.`);
  console.log("No fake study/task/mock data was created — every user starts at zero.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
