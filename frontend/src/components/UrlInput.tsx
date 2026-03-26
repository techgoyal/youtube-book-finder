interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function UrlInput({ value, onChange, onSubmit, loading }: UrlInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) onSubmit();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="https://www.youtube.com/watch?v=..."
        disabled={loading}
        className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:bg-gray-100 disabled:cursor-not-allowed transition"
      />
      <button
        onClick={onSubmit}
        disabled={loading || !value.trim()}
        className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
      >
        Find Books
      </button>
    </div>
  );
}
