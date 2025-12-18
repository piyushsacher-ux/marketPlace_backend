const mongoose = require("mongoose");
const inventorySchema = require("../models/inventorySchema");

const PRODUCTS = [
  "Rice",
  "Oil",
  "Milk",
  "Sugar",
  "Soap",
  "Flour",
  "Salt",
  "Tea",
  "Coffee",
  "Shampoo",
];

async function seedInventoryForUser(userId) {
  try {
    const dbName = `marketplace_user_${userId}`;
    const uri = `${process.env.CONNECTION_STRING}/${dbName}`;


    //yaha pe .createconnection ek new db ka reference return kr rha ha aur uss reference ke andar hum model bna rhe hai
    const conn = await mongoose.createConnection(uri);

    const Inventory = conn.model("Inventory", inventorySchema);
    const count = await Inventory.countDocuments();
    if (count > 0) {
      await conn.close();
      return;
    }

    const itemCount = 5 + Math.floor(Math.random() * 16); 
    //5-20 tk ki range hogi itemCount mai

    const items = [];

    for (let i = 0; i < itemCount; i++) {
      items.push({
        productName: PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)],
        price: Math.floor(Math.random() * 500) + 50, // ₹50–₹550
        quantity: Math.floor(Math.random() * 100) + 1,
      });
    }
    await Inventory.insertMany(items);
    await conn.close();

    console.log(`Inventory seeded for user ${userId}`);
  } catch (error) {
    console.error(`Inventory seed failed for user ${userId}`, error);
    throw error; 
  }
}
module.exports = seedInventoryForUser;
