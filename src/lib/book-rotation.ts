/** A minimal constraint for anything eligible for randomized rotation. */
type RotationItem = { slug: string };

/**
 * Pick uniformly from the best available pool without mutating the catalog.
 *
 * Priority:
 * 1. Avoid both the last book shown in this class and the last shown anywhere.
 * 2. If that empties the pool, still avoid the last book shown in this class.
 * 3. Then avoid the last book shown anywhere.
 * 4. With only one book, reuse it because no different choice exists.
 */
export function selectRotatingBook<T extends RotationItem>(
    books: readonly T[],
    previousForClass: string | null,
    previousOverall: string | null,
    randomValue: number
): T | null {
    if (books.length === 0) return null;

    let pool = books.filter(
        (book) => book.slug !== previousForClass && book.slug !== previousOverall
    );
    if (pool.length === 0) {
        pool = books.filter((book) => book.slug !== previousForClass);
    }
    if (pool.length === 0) {
        pool = books.filter((book) => book.slug !== previousOverall);
    }
    if (pool.length === 0) {
        pool = [...books];
    }

    const finite = Number.isFinite(randomValue) ? randomValue : 0;
    const normalized = Math.min(Math.max(finite, 0), 0.9999999999999999);
    return pool[Math.floor(normalized * pool.length)] ?? pool[0] ?? null;
}
