import mongoose, { Schema } from "mongoose";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcrypt";

const productSchema = new Schema(
  {},
  {
    timestamps: true,
  }
);

export const Product = mongoose.model("Product", productSchema);
