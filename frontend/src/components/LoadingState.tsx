export default function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-gray-500">
      <svg
        className="h-10 w-10 animate-spin text-red-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p className="text-sm font-medium">Fetching transcript and analyzing with AI…</p>
    </div>
  );
}
