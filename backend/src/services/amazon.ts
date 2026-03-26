export async function getAmazonUrl(title: string, author: string): Promise<string> {
  const searchFallback = `https://www.amazon.com/s?k=${encodeURIComponent(`${title} ${author}`)}`;
  try {
    const q = encodeURIComponent(`intitle:${title} inauthor:${author}`);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`);
    if (!res.ok) return searchFallback;
    const data = await res.json() as { items?: { volumeInfo?: { industryIdentifiers?: { type: string; identifier: string }[] } }[] };
    const isbn = data.items?.[0]?.volumeInfo?.industryIdentifiers
      ?.find((id) => id.type === "ISBN_13")?.identifier;
    return isbn ? `https://www.amazon.com/dp/${isbn}` : searchFallback;
  } catch {
    return searchFallback;
  }
}
