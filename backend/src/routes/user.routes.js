console.log("user.routes.js loaded ✅");

import { Router } from "express";
import {
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
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = Router();

// Public routes
console.log("refreshAccessToken =", refreshAccessToken);
// router.post("/register", registerUser);
// router.get("/verify-email/:token", verifyEmail);
// router.post("/forgot-password", forgotPassword);
// router.post("/reset-password/:token", resetPassword);
// router.post("/login", loginUser);

// // router.post("/refresh-token", refreshAccessToken);

// // Protected routes
// router.use(verifyJWT); // All routes after this middleware require a valid JWT

// router.post("/logout", logoutUser);
// router.get("/profile", getProfile);
// router.put("/profile", updateProfile);
// router.post(
//   "/profile/upload-pic",
//   upload.single("profilePic"),
//   uploadProfilePic
// );

const test_email = async (req, res) => {
  try {
    const { to } = req.body;
    await sendEmail({
      to,
      subject: "Test Email",
      text: "This is a test email from your app",
    });
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send email" });
  }
};
router.post("/test-email", test_email);

export default router;
