// =============================================================================
// YOUTUBE BOOK FINDER — COMPLETE BACKEND
// Stack: Node.js + Express + TypeScript
// =============================================================================
// Runner:     tsx watch src/index.ts  (handles ESM/CJS interop transparently)
// Entry:      src/index.ts
// Route:      src/routes/books.ts       POST /api/books
// Service:    src/services/transcript.ts  YouTube transcript fetching
// Service:    src/services/claude.ts      Claude AI book extraction
// Utility:    src/utils/youtube.ts        URL → video ID parsing
// =============================================================================

import "dotenv/config";
import express, { Router, Request, Response } from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";

// =============================================================================
// utils/youtube.ts
// =============================================================================

/**
 * Extracts a YouTube video ID from various URL formats.
 * Supports:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtu.be/VIDEO_ID
 *   https://youtube.com/shorts/VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/(?:shorts|embed|v)\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// =============================================================================
// services/transcript.ts
// =============================================================================

interface TranscriptResult {
  text: string;
}

async function fetchTranscript(videoId: string): Promise<TranscriptResult> {
  const segments = await YoutubeTranscript.fetchTranscript(videoId);

  if (!segments || segments.length === 0) {
    throw new Error("NO_TRANSCRIPT");
  }

  const text = segments.map((s) => s.text).join(" ");
  return { text };
}

// =============================================================================
// services/claude.ts
// =============================================================================

export interface Book {
  title: string;
  author: string;
  context: string;
}

const anthropicClient = new Anthropic();

const SYSTEM_PROMPT = `You are a book extraction assistant. Your job is to identify all book recommendations mentioned in YouTube video transcripts.

Rules:
- Only include books that are explicitly named in the transcript (title, author, or both).
- Do NOT include vague references like "a book about X" without a title.
- Include the context: who recommended it and why, based on what's said in the transcript.
- Return ONLY a valid JSON array. No markdown, no explanation, no code fences.
- If no books are mentioned, return an empty array: []

Response format:
[
  {
    "title": "Book Title",
    "author": "Author Name or Unknown",
    "context": "Brief explanation of why/how it was mentioned"
  }
]`;

async function extractBooks(transcript: string): Promise<Book[]> {
  const stream = anthropicClient.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here is the transcript from a YouTube video. Extract all book recommendations:\n\n${transcript}`,
      },
    ],
  });

  const response = await stream.finalMessage();

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const raw = textBlock.text.trim();

  // Strip any accidental markdown code fences
  const jsonStr = raw
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "")
    .trim();

  const books: Book[] = JSON.parse(jsonStr);
  return books;
}

// =============================================================================
// routes/books.ts
// =============================================================================

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Please enter a valid YouTube URL." });
  }

  const videoId = extractVideoId(url.trim());
  if (!videoId) {
    return res.status(400).json({ error: "Please enter a valid YouTube URL." });
  }

  try {
    const { text: transcript } = await fetchTranscript(videoId);
    const books = await extractBooks(transcript);

    if (books.length === 0) {
      return res.json({
        books: [],
        videoTitle: "",
        message: "No book recommendations were found in this video.",
      });
    }

    return res.json({ books, videoTitle: "" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (
      message === "NO_TRANSCRIPT" ||
      message.toLowerCase().includes("transcript")
    ) {
      return res
        .status(422)
        .json({ error: "This video has no available transcript." });
    }

    if (
      message.toLowerCase().includes("anthropic") ||
      message.toLowerCase().includes("claude")
    ) {
      return res
        .status(502)
        .json({ error: "Failed to analyze transcript. Please try again." });
    }

    console.error("Unexpected error:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please check your connection." });
  }
});

// =============================================================================
// index.ts — Server entry point
// =============================================================================

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());
app.use("/api/books", router);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
