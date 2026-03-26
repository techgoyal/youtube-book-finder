interface Book {
  title: string;
  author: string;
  context: string;
  amazonUrl: string;
}

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const goodreadsUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(`${book.title} ${book.author}`)}`;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 leading-snug">{book.title}</h3>
          <p className="mt-0.5 text-sm text-red-600 font-medium">{book.author}</p>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{book.context}</p>
        </div>
      </div>

      <div className="flex border-t border-gray-100 divide-x divide-gray-100">
        <a
          href={book.amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-amber-700 hover:bg-amber-50 transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.699-3.182v.685zm3.186 7.705c-.209.189-.512.201-.745.074-1.047-.872-1.234-1.276-1.814-2.106-1.734 1.767-2.962 2.297-5.209 2.297-2.66 0-4.731-1.641-4.731-4.925 0-2.565 1.391-4.309 3.37-5.164 1.715-.754 4.11-.891 5.942-1.095v-.41c0-.753.06-1.642-.384-2.294-.385-.579-1.124-.82-1.775-.82-1.205 0-2.277.618-2.54 1.897-.054.285-.261.567-.549.582l-3.061-.333c-.259-.056-.548-.266-.472-.66C5.578 2.507 8.672 1.5 11.431 1.5c1.415 0 3.263.376 4.379 1.447 1.416 1.323 1.281 3.086 1.281 5.007v4.534c0 1.363.566 1.962 1.099 2.699.186.262.227.576-.01.769l-2.036 1.839zM21.479 19.818c-2.24 1.655-5.488 2.537-8.288 2.537-3.923 0-7.452-1.449-10.121-3.858-.21-.189-.022-.449.229-.301 2.883 1.677 6.449 2.687 10.131 2.687 2.484 0 5.214-.515 7.729-1.583.379-.161.697.249.32.518z"/>
          </svg>
          Buy on Amazon
        </a>
        <a
          href={goodreadsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.43 23.995c-3.608-.208-6.274-1.907-7.288-4.97-.062-.19-.093-.388-.122-.578l-.031-.2h1.956l.062.29c.448 2.059 2.304 3.453 4.836 3.609 3.365.207 5.551-1.668 5.551-4.979v-1.52l-.338.57c-1.054 1.8-2.748 2.767-4.986 2.825-4.158.1-7.022-2.765-7.022-7.669 0-2.257.638-4.228 1.852-5.677C6.93 4.254 8.863 3.4 11.074 3.4c2.286 0 4.007.981 5.045 2.867l.338.62V3.734h1.86v14.181c0 2.307-.7 4.04-2.134 5.215-1.336 1.104-3.417 1.715-4.763 1.865zm.354-7.838c1.443 0 2.696-.598 3.56-1.723.863-1.124 1.302-2.699 1.302-4.618 0-1.9-.44-3.44-1.29-4.54-.862-1.116-2.129-1.728-3.572-1.728-1.5 0-2.748.612-3.597 1.728-.837 1.1-1.277 2.64-1.277 4.54 0 1.919.44 3.494 1.277 4.618.85 1.125 2.097 1.723 3.597 1.723z"/>
          </svg>
          Goodreads
        </a>
      </div>
    </div>
  );
}
