import mongoose from "mongoose";

let isConnected = false;

// ===============================
// MongoDB Connection (Serverless Safe)
// ===============================
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
}

// ===============================
// Schema
// ===============================
const chatSchema = new mongoose.Schema({
  userId: String,
  messages: [
    {
      role: String,
      content: String,
    },
  ],
});

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);

// ===============================
// Main Handler
// ===============================
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ status: "KabiGPT running 🚀" });
  }

  try {
    await connectDB();

    const message = req.body?.message;

    if (!message || !message.text) {
      return res.status(200).json({ status: "No message" });
    }

    const chatId = message.chat.id;
    const userText = message.text;

    // ==========================
    // /start command
    // ==========================
    if (userText === "/start") {
      await sendMessage(
        chatId,
        "Vanakkam! 👋 I am *KabiGPT* 🤖✨\n\nUngaloda AI nanban! Epdi help pannatum? 🚀",
        true
      );
      return res.status(200).json({ success: true });
    }

    await sendTyping(chatId);

    // ==========================
    // Get or Create User Chat
    // ==========================
    let userChat = await Chat.findOne({ userId: chatId });

    if (!userChat) {
      userChat = new Chat({
        userId: chatId,
        messages: [],
      });
    }

    // Add user message
    userChat.messages.push({
      role: "user",
      content: userText,
    });

    const lastMessages = userChat.messages.slice(-10);

    // ==========================
    // KabiGPT Personality Prompt
    // ==========================
    const systemPrompt = {
      role: "system",
      content: `
You are KabiGPT 🤖✨

Style:
- Speak in natural Tanglish (Tamil + simple English mix).
- Use local friendly words like:
  "namba", "machi", "mama", "bro", "thambi".
- Talk like a close Tamil friend.
- Very friendly and casual.
- Simple English only (no professional or complex words).
- Not formal.
- Not corporate tone.

Example tone:
"Vanakkam machi! Epdi iruka? Namba idha easy ah solve pannalaam 😊"
"Don’t worry mama, small issue dhaan. Fix pannidalaam 🔥"

Rules:
- Always happy and positive.
- Motivate like a supportive friend.
- Add light fun when suitable.
- Use emojis sometimes 😊🔥🚀 (not too many).
- Never use bad words.
- Never be angry.
- Never insult.
- If user is rude, reply calmly and kindly.
- Respect everyone always.
- Friendly but not disrespectful.

Behavior:
- Encourage users when they feel low.
- Explain technical topics in simple words.
- Make Tamil users feel comfortable.
- End some replies like:
  "Namba pannalaam da 💪"
  "Easy ah mudichiduvom machi 🚀"
  "Super ah pogudhu mama 😎"

You are a happy, fun, motivating Tamil AI friend 💛
`
    };

    // ==========================
    // Call Ollama Cloud
    // ==========================
    const aiResponse = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "ministral-3:3b-cloud",
        messages: [systemPrompt, ...lastMessages],
        stream: false,
      }),
    });

    const data = await aiResponse.json();
    const reply = data.message?.content || "⚠️ Sorry! Something went wrong.";

    // Save AI reply
    userChat.messages.push({
      role: "assistant",
      content: reply,
    });

    await userChat.save();

    await sendMessage(chatId, reply);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Error:", error);
    return res.status(200).json({ error: true });
  }
}

// ===============================
// Send Message
// ===============================
async function sendMessage(chatId, text, markdown = false) {
  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: markdown ? "Markdown" : undefined,
    }),
  });
}

// ===============================
// Typing Indicator
// ===============================
async function sendTyping(chatId) {
  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      action: "typing",
    }),
  });
}