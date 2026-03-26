import { Router, Request, Response } from "express";
import { extractVideoId } from "../utils/youtube";
import { fetchTranscript } from "../services/transcript";
import { extractBooks } from "../services/claude";

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

    if (message === "NO_TRANSCRIPT" || message.toLowerCase().includes("transcript")) {
      return res.status(422).json({
        error: "This video has no available transcript.",
      });
    }

    if (message.toLowerCase().includes("anthropic") || message.toLowerCase().includes("claude")) {
      return res.status(502).json({
        error: "Failed to analyze transcript. Please try again.",
      });
    }

    console.error("Unexpected error:", err);
    return res.status(500).json({
      error: "Something went wrong. Please check your connection.",
    });
  }
});

export default router;
