import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      // required: true,
      unique: true,
      trim: true,
      index: true,
      match: /^[0-9]{10}$/, // optional regex for validation
    },
    role: {
      type: String,
      enum: ["admin", "buyer", "seller"],
      required: true,
      default: "buyer",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    profilePic: {
      type: String, // Cloudinary image URL
    },
    refreshToken: {
      type: String,
    },
    resetToken: {
      type: String,
    },
    resetTokenExpire: {
      type: Date,
    },
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    cart: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    //? email verification
    emailVerificationToken: String,
    emailVerificationTokenExpires: Date,
    isEmailVerified: { type: Boolean, default: false },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

//? Hash encryption before saving new user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateResetToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.RESET_TOKEN_SECRET,
    {
      expiresIn: process.env.RESET_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);
