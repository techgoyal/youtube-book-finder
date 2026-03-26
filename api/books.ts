import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";

// --- Video ID extraction ---
function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1);
    if (parsed.hostname.includes("youtube.com")) return parsed.searchParams.get("v");
  } catch {
    return null;
  }
  return null;
}

// --- Transcript ---
// Fetches transcript directly from YouTube with browser-like headers,
// bypassing IP restrictions that affect the youtube-transcript package on cloud servers.
async function fetchTranscript(videoId: string): Promise<string> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers });
  if (!pageRes.ok) throw new Error("NO_TRANSCRIPT");

  const html = await pageRes.text();

  // Extract captions track list from the embedded player response JSON
  const captionsMatch = html.split('"captions":');
  if (captionsMatch.length < 2) throw new Error("NO_TRANSCRIPT");

  let captionsJson: { playerCaptionsTracklistRenderer?: { captionTracks?: { baseUrl: string; languageCode: string }[] } };
  try {
    captionsJson = JSON.parse(captionsMatch[1].split(',"videoDetails')[0].replace(/\n/g, ""));
  } catch {
    throw new Error("NO_TRANSCRIPT");
  }

  const tracks = captionsJson?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || tracks.length === 0) throw new Error("NO_TRANSCRIPT");

  // Prefer English, fall back to first available track
  const track = tracks.find((t) => t.languageCode === "en") ?? tracks[0];

  const captionRes = await fetch(track.baseUrl, { headers });
  if (!captionRes.ok) throw new Error("NO_TRANSCRIPT");

  const xml = await captionRes.text();
  const texts = Array.from(xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g))
    .map((m) => m[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
    );

  if (texts.length === 0) throw new Error("NO_TRANSCRIPT");
  return texts.join(" ");
}

// --- Claude ---
interface Book {
  title: string;
  author: string;
  context: string;
  amazonUrl: string;
}

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

async function extractBooks(transcript: string): Promise<Omit<Book, "amazonUrl">[]> {
  const client = new Anthropic();
  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Here is the transcript from a YouTube video. Extract all book recommendations:\n\n${transcript}` }],
  });
  const response = await stream.finalMessage();
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response from Claude");
  const raw = textBlock.text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(raw);
}

// --- Amazon URL ---
async function getAmazonUrl(title: string, author: string): Promise<string> {
  const fallback = `https://www.amazon.com/s?k=${encodeURIComponent(`${title} ${author}`)}`;
  try {
    const q = encodeURIComponent(`intitle:${title} inauthor:${author}`);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`);
    if (!res.ok) return fallback;
    const data = await res.json() as { items?: { volumeInfo?: { industryIdentifiers?: { type: string; identifier: string }[] } }[] };
    const isbn = data.items?.[0]?.volumeInfo?.industryIdentifiers?.find((id) => id.type === "ISBN_13")?.identifier;
    return isbn ? `https://www.amazon.com/dp/${isbn}` : fallback;
  } catch {
    return fallback;
  }
}

// --- Handler ---
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
    const transcript = await fetchTranscript(videoId);
    const books = await extractBooks(transcript);

    if (books.length === 0) {
      return res.json({ books: [], videoTitle: "", message: "No book recommendations were found in this video." });
    }

    const booksWithLinks = await Promise.all(
      books.map(async (book) => ({ ...book, amazonUrl: await getAmazonUrl(book.title, book.author) }))
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
