import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import sendEmail from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const signupUser = asyncHandler(async (req, res) => {
  // check for any missing fields
  const { username, email, password, fullName, phone, role } = req.body;
  if (
    [fullName, email, password, username, role].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check for existing user
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // signup new user
  const user = await User.create({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
    role,
    phone,
  });

  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check for user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  // return res
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }
  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User login successful"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // removes field from document
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const sendVerificationEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const token = user.generateEmailVerificationToken();
  //* generateEmailVerificationToken() -> this.emailVerificationToken = token;
  //* imp to save token to db
  await user.save();

  const verificationURL = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const message = `Click to verify your email: ${verificationURL}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your email",
    text: message,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; border-radius: 8px;">
        <h2 style="color: #2e6f95;">Welcome to <span style="color:#f47c3c;">OmniStore</span>!</h2>
        <p style="font-size: 16px; color: #333;">Hi ${user.fullName || "there"},</p>
        <p style="font-size: 16px; color: #333;">Thank you for signing up. <br>Please verify your email address to get started with your seamless OmniStore experience.</p>
        <div style="margin: 20px 0;">
          <a href="${verificationURL}" style="padding: 12px 20px; background-color: #f47c3c; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
        </div>
        <p style="font-size: 14px; color: #555;">This link will expire in 15 minutes for your security.</p>
        <p style="font-size: 14px; color: #aaa;">If you didn't request this, you can safely ignore this email.</p>
        <hr />
        <p style="font-size: 12px; color: #999;">© ${new Date().getFullYear()} OmniStore. All rights reserved.</p>
      </div>
    `,
  });

  res.status(200).json({ message: "Verification email sent" });
});

const verifyEmailToken = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token)
    return res
      .status(400)
      .json(new ApiError(400, "Verification token missing"));

  try {
    const decoded = jwt.verify(
      token,
      process.env.EMAIL_VERIFICATION_TOKEN_SECRET
    );
    console.log("decoded: ", decoded);

    const user = await User.findById(decoded._id);
    if (!user) return res.status(404).json(new ApiError(404, "User not found"));

    // Check if token matches and hasn't expired
    if (
      user.emailVerificationToken !== token ||
      user.emailVerificationTokenExpires < Date.now()
    ) {
      return res
        .status(400)
        .json(new ApiError(400, "Invalid or expired verification token"));
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;

    await user.save();

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Email verified successfully"));
  } catch (error) {
    console.error("verifyEmailToken error:", error);
    res.status(400).json(new ApiError(400, "Invalid or expired token"));
  }
});

export {
  signupUser,
  loginUser,
  logoutUser,
  sendVerificationEmail,
  verifyEmailToken,
};
