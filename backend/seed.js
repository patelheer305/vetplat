// seed.js
import mongoose from "mongoose";
import Doctor from "./models/Doctor.js";
import Farmer from "./models/Farmer.js";

export default async function seed() {
  console.log("🌱 Running database seeder...");

  try {
    // Insert doctors only if none exist
    const doctorCount = await Doctor.countDocuments();
    if (doctorCount === 0) {
      await Doctor.insertMany([
        { name: "Dr. A Patel", specialization: "Veterinary", email: "dr.patel@example.com" },
        { name: "Dr. B Sharma", specialization: "Animal Nutrition", email: "dr.sharma@example.com" }
      ]);
      console.log("✅ Doctors seeded");
    } else {
      console.log("ℹ️ Doctors already exist, skipping...");
    }

    // Insert farmers only if none exist
    const farmerCount = await Farmer.countDocuments();
    if (farmerCount === 0) {
      await Farmer.insertMany([
        { name: "Rajesh Kumar", location: "Gujarat", email: "rajesh@example.com" },
        { name: "Sunita Devi", location: "Rajasthan", email: "sunita@example.com" }
      ]);
      console.log("✅ Farmers seeded");
    } else {
      console.log("ℹ️ Farmers already exist, skipping...");
    }

  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}
