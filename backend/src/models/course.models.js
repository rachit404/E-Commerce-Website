import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0, // discount percentage
      min: 0,
      max: 100,
    },
    category: [
      {
        type: String,
      },
    ],
    modules: [
      {
        type: String,
      },
      //TODO: moduleSchema for future
      // {
      //   title: { type: String, required: true },
      //   description: { type: String },
      //   videoUrl: { type: String },
      //   duration: { type: Number }, // in minutes
      //   resources: [{ type: String }], // PDF links, etc.
      // }
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    thumbnail: {
      type: String, // cloudinary url
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
    },
    language: [
      {
        type: String,
      },
    ],
    enrolledUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Course = mongoose.model("Course", courseSchema);
