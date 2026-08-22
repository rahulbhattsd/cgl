import mongoose from "mongoose";
const { Schema, model } = mongoose;

// NOTE ON DATES: all user-facing "date" fields are stored as plain
// "YYYY-MM-DD" strings (the user's calendar day), never as Date/UTC
// timestamps. This avoids off-by-one / timezone bugs entirely because
// we never convert a day into a timezone-aware instant.

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const TopicSchema = new Schema({
  subject: { type: String, required: true, enum: ["Mathematics", "English", "Reasoning", "General Awareness"] },
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
});

const TopicProgressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    lecture: { type: Boolean, default: false },
    notes: { type: Boolean, default: false },
    practice: { type: Boolean, default: false },
    test: { type: Boolean, default: false },
    revision1: { type: Boolean, default: false },
    revision2: { type: Boolean, default: false },
  },
  { timestamps: true }
);
TopicProgressSchema.index({ user: 1, topic: 1 }, { unique: true });

const StudySessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    subject: { type: String, required: true },
    topic: { type: String, default: "" },
    duration: { type: Number, required: true, min: 0 }, // minutes
    questionsAttempted: { type: Number, default: 0, min: 0 },
    questionsCorrect: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);
StudySessionSchema.index({ user: 1, date: 1 });

const TaskSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: String, required: true }, // YYYY-MM-DD
    subject: { type: String, default: "" },
    topic: { type: String, default: "" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    estimatedDuration: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);
TaskSchema.index({ user: 1, date: 1 });

const MockTestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    type: { type: String, enum: ["Full Mock", "Sectional"], required: true },
    tier: { type: String, enum: ["Tier 1", "Tier 2"], required: true },
    subject: { type: String, default: "" }, // required only for Sectional (validated in route)
    name: { type: String, default: "" },
    totalMarks: { type: Number, required: true, min: 0 },
    score: { type: Number, required: true },
    attempted: { type: Number, default: 0, min: 0 },
    correct: { type: Number, default: 0, min: 0 },
    wrong: { type: Number, default: 0, min: 0 },
    unattempted: { type: Number, default: 0, min: 0 },
    timeTaken: { type: Number, default: 0 }, // minutes
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);
MockTestSchema.index({ user: 1, date: 1 });

export const User = model("User", UserSchema);
export const Topic = model("Topic", TopicSchema);
export const TopicProgress = model("TopicProgress", TopicProgressSchema);
export const StudySession = model("StudySession", StudySessionSchema);
export const Task = model("Task", TaskSchema);
export const MockTest = model("MockTest", MockTestSchema);
