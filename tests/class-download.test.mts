import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { classDownloadFilename } from "../src/lib/class-download.ts";

describe("class handout download filenames", () => {
    test("names the class PDF clearly", () => {
        assert.equal(
            classDownloadFilename("1", "What it means to be born again", "pdf", ".pdf"),
            "JBC Class 1 - What it means to be born again - Class PDF.pdf"
        );
    });

    test("names the main points handout clearly without an invalid slash", () => {
        assert.equal(
            classDownloadFilename("2", "Who you are in Christ", "scriptures", ".pdf"),
            "JBC Class 2 - Who you are in Christ - Main Points and Scriptures.pdf"
        );
    });
});
