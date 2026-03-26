import { useState } from "react";
import UrlInput from "./components/UrlInput";
import BookCard from "./components/BookCard";
import LoadingState from "./components/LoadingState";

interface Book {
  title: string;
  author: string;
  context: string;
}

type AppState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; books: Book[]; message?: string }
  | { status: "error"; message: string };

export default function App() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<AppState>({ status: "idle" });

  const handleSubmit = async () => {
    if (!url.trim()) return;

    setState({ status: "loading" });

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = (await res.json()) as {
        books?: Book[];
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Something went wrong. Please check your connection." });
        return;
      }

      setState({ status: "success", books: data.books ?? [], message: data.message });
    } catch {
      setState({ status: "error", message: "Something went wrong. Please check your connection." });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">YouTube Book Finder</h1>
          <p className="mt-2 text-gray-500">
            Paste a YouTube URL to extract all book recommendations mentioned in the video.
          </p>
        </div>

        {/* Input */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <UrlInput
            value={url}
            onChange={setUrl}
            onSubmit={handleSubmit}
            loading={state.status === "loading"}
          />
        </div>

        {/* Results */}
        <div className="mt-8">
          {state.status === "loading" && <LoadingState />}

          {state.status === "error" && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-red-700 text-sm">
              {state.message}
            </div>
          )}

          {state.status === "success" && state.books.length === 0 && (
            <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-5 py-4 text-yellow-800 text-sm">
              {state.message ?? "No book recommendations were found in this video."}
            </div>
          )}

          {state.status === "success" && state.books.length > 0 && (
            <div>
              <p className="mb-4 text-sm font-medium text-gray-500">
                Found {state.books.length} book{state.books.length !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-col gap-4">
                {state.books.map((book, i) => (
                  <BookCard key={i} book={book} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
