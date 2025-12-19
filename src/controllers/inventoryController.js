const inventorySchema = require("../models/inventorySchema");
const getUserDb = require("../utils/getUserDb");

exports.addItem = async (req, res) => {
  const { productName, price, quantity } = req.body;

  if (!productName || price == null || quantity == null) {
    return res.status(400).json({ message: "All fields required" });
  }

  const conn = await getUserDb(req.userId);
  const Inventory = conn.model("Inventory", inventorySchema);

  const item = await Inventory.create({
    productName,
    price,
    quantity,
  });

  await conn.close();

  res.status(201).json(item);
};

exports.updateItem = async (req, res) => {
  const { itemId } = req.params;
  const updates = req.body;

  const conn = await getUserDb(req.userId);
  const Inventory = conn.model("Inventory", inventorySchema);

  const item = await Inventory.findOneAndUpdate(
    { _id: itemId, isDeleted: false },
    updates,
    { new: true }
  );

  await conn.close();

  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }

  res.json(item);
};

exports.deleteItem = async (req, res) => {
  const { itemId } = req.params;

  const conn = await getUserDb(req.userId);
  const Inventory = conn.model("Inventory", inventorySchema);

  const item = await Inventory.findOneAndUpdate(
    { _id: itemId },
    { isDeleted: true },
    { new: true }
  );

  await conn.close();

  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }

  res.json({ message: "Item deleted" });
};

exports.getMyInventory = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const conn = await getUserDb(req.userId);
  const Inventory = conn.model("Inventory", inventorySchema);

  const items = await Inventory.find({ isDeleted: false })
    .skip(skip)
    .limit(limit);

  await conn.close();

  await Activity.create({
    userId: req.userId,
    action: "VIEW_INVENTORY",
    date: new Date(),
  });

  res.json({ page, count: items.length, items });
};
