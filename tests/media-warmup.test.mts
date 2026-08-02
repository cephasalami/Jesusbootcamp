import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { shouldPrebufferPodcast } from "../src/lib/media-warmup.ts";

describe("class media warming", () => {
    test("allows a podcast buffer when the connection has no restrictions", () => {
        assert.equal(shouldPrebufferPodcast(), true);
        assert.equal(shouldPrebufferPodcast({ effectiveType: "4g" }), true);
    });

    test("does not prebuffer when the learner asks to save data", () => {
        assert.equal(shouldPrebufferPodcast({ saveData: true, effectiveType: "4g" }), false);
    });

    test("does not prebuffer on 2G connections", () => {
        assert.equal(shouldPrebufferPodcast({ effectiveType: "slow-2g" }), false);
        assert.equal(shouldPrebufferPodcast({ effectiveType: "2g" }), false);
    });
});
