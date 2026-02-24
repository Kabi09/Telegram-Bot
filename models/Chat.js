import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  userId: String,
  messages: [
    {
      role: String,
      content: String
    }
  ]
});

export default mongoose.model("Chat", chatSchema);