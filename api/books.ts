import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractVideoId } from "../backend/src/utils/youtube";
import { fetchTranscript } from "../backend/src/services/transcript";
import { extractBooks } from "../backend/src/services/claude";
import { getAmazonUrl } from "../backend/src/services/amazon";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

    const booksWithLinks = await Promise.all(
      books.map(async (book) => ({
        ...book,
        amazonUrl: await getAmazonUrl(book.title, book.author),
      }))
    );

    return res.json({ books: booksWithLinks, videoTitle: "" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message === "NO_TRANSCRIPT" || message.toLowerCase().includes("transcript")) {
      return res.status(422).json({ error: "This video has no available transcript." });
    }
    if (message.toLowerCase().includes("anthropic") || message.toLowerCase().includes("claude")) {
      return res.status(502).json({ error: "Failed to analyze transcript. Please try again." });
    }

    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Something went wrong. Please check your connection." });
  }
}
