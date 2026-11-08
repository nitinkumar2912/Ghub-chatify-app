import mongoose from "mongoose";
import { assertRequiredEnvironment, ENV } from "../lib/env.js";
import Message from "../models/Message.js";
import Report from "../models/Report.js";
import Session from "../models/Session.js";
import User from "../models/User.js";

assertRequiredEnvironment();

try {
  await mongoose.connect(ENV.MONGO_URI);
  for (const model of [User, Message, Session, Report]) await model.createIndexes();
  console.info(JSON.stringify({ level: "info", event: "indexes_created", models: 4 }));
} catch (error) {
  console.error(
    JSON.stringify({ level: "error", event: "index_creation_failed", message: error.message }),
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
