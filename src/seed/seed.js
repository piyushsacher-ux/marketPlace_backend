const seedUsers = require("./usersSeed");
const seedInventoryForUser = require("./inventorySeed");
const Admin = require("../models/adminModel");
const bcrypt = require("bcrypt");

async function seedAll() {
  if (await Admin.countDocuments() === 0) {
    await Admin.create({
      email: "admin@yopmail.com",
      password: await bcrypt.hash("admin123", 10),
    });
  }

  const users = await seedUsers();

  for (const user of users) {
    await seedInventoryForUser(user._id);
  }

  console.log("SEED COMPLETED SUCCESSFULLY");
}

module.exports = seedAll;
