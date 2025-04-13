import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Register User
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName, phone } = req.body;

  if (!username || !email || !password || !fullName || !phone) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(409, "User already exists with given email or username");
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await User.create({
    username,
    email,
    password,
    fullName,
    phone,
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpires: Date.now() + 1000 * 60 * 60, // 1 hour
  });

  // Send Verification Email
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your email",
    text: `Click the link to verify your email: ${verifyUrl}`,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { userId: user._id },
        "User registered successfully. Please verify your email."
      )
    );
});

// Email Verification
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, "Invalid or expired verification token");

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Email verified successfully"));
});

// Forgot Password - Send Reset Email
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetToken = hashedResetToken;
  user.passwordResetExpires = Date.now() + 1000 * 60 * 15; // 15 minutes
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: "Password Reset",
    text: `Click the link to reset your password: ${resetUrl}`,
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Reset password link sent to email"));
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) throw new ApiError(400, "New password is required");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, "Invalid or expired reset token");

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json(new ApiResponse(200, null, "Password reset successful"));
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
        },
      },
      "Login successful"
    )
  );
});

// Logout User
const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  user.refreshToken = null;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, null, "Logout successful"));
});

// Refresh Access Token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  const user = await User.findById(decoded._id);
  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      "Access token refreshed"
    )
  );
});

// Get Profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );
  if (!user) throw new ApiError(404, "User not found");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Profile fetched successfully"));
});

// Update Profile
const updateProfile = asyncHandler(async (req, res) => {
  const updates = req.body;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  res.status(200).json(new ApiResponse(200, user, "Profile updated"));
});

// Upload Profile Picture
const uploadProfilePic = asyncHandler(async (req, res) => {
  const localFilePath = req.file?.path;

  if (!localFilePath) {
    throw new ApiError(400, "No file uploaded");
  }

  const cloudinaryResult = await uploadOnCloudinary(localFilePath);

  if (!cloudinaryResult?.url) {
    throw new ApiError(500, "Upload failed");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profilePic: cloudinaryResult.url },
    { new: true }
  );

  res.status(200).json(new ApiResponse(200, user, "Profile picture updated"));
});

export {
  registerUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getProfile,
  updateProfile,
  uploadProfilePic,
};
