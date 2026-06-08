const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://somensnayak_db_user:<db_password>@cluster0.6yz4w8v.mongodb.net/?appName=Cluster0");
    console.log("MongoDB connected ✅");
  } catch (error) {
    console.log("DB connection error ❌", error);
  }
};

module.exports = connectDB;