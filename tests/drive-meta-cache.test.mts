import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { driveMetaCacheKey } from "../src/lib/kv.ts";

describe("shared Drive metadata cache", () => {
    test("uses a dedicated key and preserves case-sensitive Drive IDs", () => {
        assert.equal(driveMetaCacheKey(" AbC-123 "), "jbc:drive-meta:AbC-123");
    });
});
