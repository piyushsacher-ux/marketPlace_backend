const mongoose = require("mongoose");

module.exports = async function getUserDb(userId) {
  const dbName = `marketplace_user_${userId}`;
  const uri = `${process.env.CONNECTION_STRING}/${dbName}`;
  return mongoose.createConnection(uri);
};
