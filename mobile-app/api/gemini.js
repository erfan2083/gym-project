import axios from "axios";

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  "";

export const hasGeminiKey = () => Boolean(GEMINI_API_KEY);

const buildUrl = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export async function generateGeminiResponse({ history = [], systemPrompt }) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing. Set EXPO_PUBLIC_GEMINI_API_KEY.");
  }

  const contents = history.map((msg) => ({
    role: msg.role === "model" ? "model" : "user",
    parts: [{ text: msg.content || "" }],
  }));

  const body = {
    contents,
  };

  if (systemPrompt) {
    body.systemInstruction = {
      role: "user",
      parts: [{ text: systemPrompt }],
    };
  }

  const { data } = await axios.post(buildUrl(), body, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.output_text ||
    "";

  return text;
}
