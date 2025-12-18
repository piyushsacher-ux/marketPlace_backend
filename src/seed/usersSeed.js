const User = require("../models/userModel");
const bcrypt = require("bcrypt");

const BASE_LAT = 28.6139; 
const BASE_LNG = 77.2090;

function random() {
  return (Math.random() - 0.5) * 0.4;
}

async function seedUsers() {
  const users = [];

  for (let i = 0; i < 20; i++) {
    const email = `user${i}.marketplace@yopmail.com`;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        username: `user${i}`,
        password: await bcrypt.hash(process.env.SEED_USER_PASS, 10),
        isEmailVerified: true,
        location: {
          type: "Point",
          coordinates: [
            BASE_LNG + random(),
            BASE_LAT + random(),
          ],
        },
      });
    }

    users.push(user);
  }

  return users;
}

module.exports = seedUsers;
