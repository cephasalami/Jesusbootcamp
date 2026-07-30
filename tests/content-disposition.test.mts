import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { contentDisposition } from "../src/lib/content-disposition.ts";

/**
 * Regression suite for the bug that made EVERY proxied class file fail.
 *
 * The filename template contained an em dash (U+2014 = 8212). HTTP header
 * values are ByteStrings (each char <= 255), so `Headers.set()` threw a
 * TypeError, which the route converted into the generic "temporarily
 * unavailable". The preview path builds no such header, which is exactly why
 * it kept working.
 *
 * The load-bearing assertion in each case is that the value can actually be
 * set on a Headers object without throwing.
 */
const EM_DASH = "—";

function setsCleanly(value: string): boolean {
    try {
        new Headers().set("Content-Disposition", value);
        return true;
    } catch {
        return false;
    }
}

describe("contentDisposition must never throw on a header set", () => {
    test("the exact filename that broke production", () => {
        const original = `JBC Class 1 ${EM_DASH} What it means to be born again.pdf`;
        // Prove the precondition: the raw value really is unsettable.
        assert.equal(setsCleanly(`inline; filename="${original}"`), false);

        const v = contentDisposition("inline", original);
        assert.ok(setsCleanly(v), "sanitised value must be settable");
        assert.match(v, /filename="JBC Class 1 - What it means to be born again\.pdf"/);
        assert.match(v, /filename\*=UTF-8''/);
    });

    test("every character of the ascii filename is printable ASCII", () => {
        const v = contentDisposition(
            "attachment",
            `JBC Class 4a ${EM_DASH} Wéek “Quotes” ‘x’.pptx`
        );
        assert.ok(setsCleanly(v));
        const ascii = v.match(/filename="([^"]*)"/)![1];
        for (const ch of ascii) {
            const code = ch.charCodeAt(0);
            assert.ok(code >= 0x20 && code <= 0x7e, `char ${JSON.stringify(ch)} is not printable ASCII`);
        }
    });

    test("non-Latin titles do not throw and round-trip via filename*", () => {
        for (const title of [
            `JBC Class 7 ${EM_DASH} Ἡ ἀγάπη.pdf`, // Greek
            `JBC Class 8 ${EM_DASH} שלום.pdf`, // Hebrew
            `JBC Class 9 ${EM_DASH} 生まれ変わる.pdf`, // Japanese
            `JBC Class 10 ${EM_DASH} Café Niño.pdf`, // accents
        ]) {
            const v = contentDisposition("inline", title);
            assert.ok(setsCleanly(v), `threw for ${title}`);
            const encoded = v.split("filename*=UTF-8''")[1];
            assert.equal(decodeURIComponent(encoded), title, "true name must survive");
        }
    });

    test("quotes and backslashes cannot break out of the quoted string", () => {
        const v = contentDisposition("attachment", 'evil".pdf');
        assert.ok(setsCleanly(v));
        const ascii = v.match(/filename="([^"]*)"/)![1];
        assert.ok(!ascii.includes('"'));
        assert.ok(!ascii.includes("\\"));
    });

    test("a title that sanitises to nothing still yields a filename", () => {
        const v = contentDisposition("inline", "日本語");
        assert.ok(setsCleanly(v));
        assert.match(v, /filename="download"/);
    });

    test("disposition type is preserved", () => {
        assert.match(contentDisposition("inline", "a.pdf"), /^inline;/);
        assert.match(contentDisposition("attachment", "a.pdf"), /^attachment;/);
    });
});
