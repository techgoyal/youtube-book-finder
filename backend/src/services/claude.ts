import Anthropic from "@anthropic-ai/sdk";

export interface Book {
  title: string;
  author: string;
  context: string;
}

const client = new Anthropic();

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

export async function extractBooks(transcript: string): Promise<Book[]> {
  const stream = client.messages.stream({
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
  const jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  const books: Book[] = JSON.parse(jsonStr);
  return books;
}
