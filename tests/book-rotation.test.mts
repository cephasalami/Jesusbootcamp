import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { selectRotatingBook } from "../src/lib/book-rotation.ts";
import {
    EMAIL_PDFS,
    getCheckout,
    getSellableBookPromotions,
} from "../src/config/products.ts";

const BOOKS = [{ slug: "a" }, { slug: "b" }, { slug: "c" }] as const;

describe("class book rotation", () => {
    test("avoids both the previous class book and the previous overall book", () => {
        const selected = selectRotatingBook(BOOKS, "a", "b", 0.5);
        assert.equal(selected?.slug, "c");
    });

    test("prioritises changing the book previously shown in this class", () => {
        const twoBooks = [{ slug: "a" }, { slug: "b" }] as const;
        const selected = selectRotatingBook(twoBooks, "a", "b", 0.5);
        assert.equal(selected?.slug, "b");
    });

    test("uses the supplied random value across every eligible candidate", () => {
        assert.equal(selectRotatingBook(BOOKS, null, null, 0)?.slug, "a");
        assert.equal(selectRotatingBook(BOOKS, null, null, 0.4)?.slug, "b");
        assert.equal(selectRotatingBook(BOOKS, null, null, 0.999999)?.slug, "c");
    });

    test("handles an empty catalog and an unavoidable one-book repeat", () => {
        assert.equal(selectRotatingBook([], "a", "a", 0.5), null);
        assert.equal(selectRotatingBook([{ slug: "only" }], "only", "only", 0.5)?.slug, "only");
    });

    test("does not mutate the catalog while filtering candidates", () => {
        const before = BOOKS.map((book) => book.slug);
        selectRotatingBook(BOOKS, "a", "b", 0.5);
        assert.deepEqual(BOOKS.map((book) => book.slug), before);
    });

    test("only promotes books with a working matching checkout", () => {
        const promotions = getSellableBookPromotions();
        assert.ok(promotions.length >= 2, "the current two checkout-ready books should be eligible");
        for (const book of promotions) {
            assert.equal(getCheckout(book.slug)?.productSlug, book.slug);
            assert.match(book.price, /^\$/);
            assert.ok(!(book.slug in EMAIL_PDFS), "free email PDFs are not products");
        }
    });
});
