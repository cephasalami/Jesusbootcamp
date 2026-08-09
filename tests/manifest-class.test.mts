import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { validateNewManifestClass } from "../src/lib/manifest-class.ts";

describe("new manifest class validation", () => {
    test("normalises a valid class row", () => {
        assert.deepEqual(
            validateNewManifestClass({ slug: "  5A ", sequencePosition: "06", title: "  Walking   in the Spirit  " }),
            { ok: true, value: { slug: "5a", sequencePosition: 6, title: "Walking in the Spirit" } }
        );
    });

    test("allows the real intro-class release position of zero", () => {
        assert.deepEqual(
            validateNewManifestClass({ slug: "intro", sequencePosition: "0", title: "Before we begin" }),
            { ok: true, value: { slug: "intro", sequencePosition: 0, title: "Before we begin" } }
        );
    });

    test("rejects unsafe slugs, release positions and empty titles", () => {
        assert.equal(validateNewManifestClass({ slug: "class/5", sequencePosition: "5", title: "Five" }).ok, false);
        assert.equal(validateNewManifestClass({ slug: "5", sequencePosition: "4.5", title: "Five" }).ok, false);
        assert.equal(validateNewManifestClass({ slug: "5", sequencePosition: "-1", title: "Five" }).ok, false);
        assert.equal(validateNewManifestClass({ slug: "5", sequencePosition: "5", title: "  " }).ok, false);
    });
});
