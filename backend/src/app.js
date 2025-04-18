import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    //* read more
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true })); //* read more
app.use(express.static("public")); //? for public folder created manually
app.use(cookieParser());

//? Routes
import userRouter from "./routes/user.routes.js";
app.use("/api/users", userRouter);

export { app };
