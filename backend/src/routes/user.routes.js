import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  signupUser,
  loginUser,
  logoutUser,
  sendVerificationEmail,
  verifyEmailToken,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/signup").post(signupUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);

router.route("/send-verification-email").post(verifyJWT, sendVerificationEmail);
router.route("/verify-email").get(verifyEmailToken);

export default router;
