const seedUsers = require("./usersSeed");
const seedInventoryForUser = require("./inventorySeed");
const Admin = require("../models/adminModel");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");

async function seedAll() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log("Database already seeded. Skipping seed.");
    return;
  }
  await Admin.create({
    email: "admin@yopmail.com",
    password: await bcrypt.hash(process.env.SEED_ADMIN_PASS, 10),
  });
  const users = await seedUsers();

  for (const user of users) {
    await seedInventoryForUser(user._id);
  }

  console.log("SEED COMPLETED SUCCESSFULLY");
}

module.exports = seedAll;
