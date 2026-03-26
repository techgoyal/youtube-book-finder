import { YoutubeTranscript } from "youtube-transcript";

export interface TranscriptResult {
  text: string;
  videoTitle: string;
}

export async function fetchTranscript(videoId: string): Promise<TranscriptResult> {
  const segments = await YoutubeTranscript.fetchTranscript(videoId);

  if (!segments || segments.length === 0) {
    throw new Error("NO_TRANSCRIPT");
  }

  const text = segments.map((s) => s.text).join(" ");
  return { text, videoTitle: "" };
}
