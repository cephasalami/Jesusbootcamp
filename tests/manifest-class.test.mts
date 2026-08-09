import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { validateNewManifestClass } from "../src/lib/manifest-class.ts";

describe("new manifest class validation", () => {
    test("normalises a valid class row", () => {
        assert.deepEqual(
            validateNewManifestClass({ slug: "  5A ", sequencePosition: "06", title: "  Walking   in the Spirit  " }),
            { ok: true, value: { slug: "5a", sequencePosition: 6, title: "Walking in the Spirit", materials: {} } }
        );
    });

    test("allows the real intro-class release position of zero", () => {
        assert.deepEqual(
            validateNewManifestClass({ slug: "intro", sequencePosition: "0", title: "Before we begin" }),
            { ok: true, value: { slug: "intro", sequencePosition: 0, title: "Before we begin", materials: {} } }
        );
    });

    test("rejects unsafe slugs, release positions and empty titles", () => {
        assert.equal(validateNewManifestClass({ slug: "class/5", sequencePosition: "5", title: "Five" }).ok, false);
        assert.equal(validateNewManifestClass({ slug: "5", sequencePosition: "4.5", title: "Five" }).ok, false);
        assert.equal(validateNewManifestClass({ slug: "5", sequencePosition: "-1", title: "Five" }).ok, false);
        assert.equal(validateNewManifestClass({ slug: "5", sequencePosition: "5", title: "  " }).ok, false);
    });

    test("normalises ready material links while the class is created", () => {
        const id = "1AbCdeFGhij_KlmNopQRsTuvWXyZ";
        const result = validateNewManifestClass({
            slug: "6",
            sequencePosition: "6",
            title: "Walking in love",
            materials: {
                pdf: `https://drive.google.com/file/d/${id}/view?usp=sharing`,
                quiz: "https://docs.google.com/forms/d/e/1FAIpQLSabc123/viewform",
            },
        });
        assert.deepEqual(result, {
            ok: true,
            value: {
                slug: "6",
                sequencePosition: 6,
                title: "Walking in love",
                materials: {
                    pdf: id,
                    quiz: "https://docs.google.com/forms/d/e/1FAIpQLSabc123/viewform",
                },
            },
        });
    });
});
