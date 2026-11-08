import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, maxLength: 500, trim: true },
    status: { type: String, enum: ["open", "reviewing", "closed"], default: "open" },
  },
  { timestamps: true },
);

reportSchema.index({ reportedUserId: 1, status: 1, createdAt: -1 });
reportSchema.index({ reporterId: 1, reportedUserId: 1, createdAt: -1 });

export default mongoose.model("Report", reportSchema);
