import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizeMediaType } from "../src/lib/media-type.ts";

describe("media types delivered to the browser", () => {
    test("relabels the legacy m4a type Drive stores the podcasts as", () => {
        // Classes 1, 2, 3, 4b and 5 all arrive from Drive as audio/x-m4a.
        assert.equal(normalizeMediaType("audio/x-m4a"), "audio/mp4");
        assert.equal(normalizeMediaType("audio/m4a"), "audio/mp4");
    });

    test("leaves types that are already correct alone", () => {
        assert.equal(normalizeMediaType("audio/mp4"), "audio/mp4");
        assert.equal(normalizeMediaType("audio/mpeg"), "audio/mpeg");
        assert.equal(normalizeMediaType("application/pdf"), "application/pdf");
        assert.equal(normalizeMediaType("video/mp4"), "video/mp4");
    });

    test("keeps codec parameters, which a player may rely on", () => {
        assert.equal(
            normalizeMediaType('audio/x-m4a; codecs="mp4a.40.2"'),
            'audio/mp4; codecs="mp4a.40.2"'
        );
    });

    test("is case- and whitespace-insensitive, as HTTP headers are", () => {
        assert.equal(normalizeMediaType("  Audio/X-M4A  "), "audio/mp4");
    });

    test("falls back to a generic type when Drive reports nothing", () => {
        assert.equal(normalizeMediaType(null), "application/octet-stream");
        assert.equal(normalizeMediaType(undefined), "application/octet-stream");
        assert.equal(normalizeMediaType("   "), "application/octet-stream");
    });
});
