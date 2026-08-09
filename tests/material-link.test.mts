import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
    driveFileIdFromInput,
    materialValueFromInput,
    previewUrlForMaterial,
} from "../src/lib/material-link.ts";

describe("course material links", () => {
    const FILE_ID = "1AbCdeFGhij_KlmNopQRsTuvWXyZ";

    test("normalises common Google Drive share URLs and a pasted file ID", () => {
        for (const input of [
            FILE_ID,
            `https://drive.google.com/file/d/${FILE_ID}/view?usp=sharing`,
            `https://drive.google.com/open?id=${FILE_ID}`,
            `https://docs.google.com/document/d/${FILE_ID}/edit`,
        ]) {
            assert.equal(driveFileIdFromInput(input), FILE_ID, input);
        }
        assert.equal(materialValueFromInput("video", `https://drive.google.com/file/d/${FILE_ID}/view`), FILE_ID);
    });

    test("only accepts real Google Drive references for Drive-backed materials", () => {
        for (const input of ["https://example.com/file/123", "ftp://drive.google.com/file/d/x", "not a link"]) {
            assert.equal(driveFileIdFromInput(input), null, input);
        }
    });

    test("builds an embeddable Drive preview URL", () => {
        assert.equal(
            previewUrlForMaterial("pdf", `https://drive.google.com/file/d/${FILE_ID}/view`),
            `https://drive.google.com/file/d/${FILE_ID}/preview`
        );
    });

    test("accepts public quiz links but refuses Google Forms editor links", () => {
        const publicQuiz = "https://docs.google.com/forms/d/e/1FAIpQLSabc123/viewform?usp=sharing";
        const editorQuiz = "https://docs.google.com/forms/d/1AbCdeFGhij_KlmNopQR/edit";
        assert.equal(materialValueFromInput("quiz", publicQuiz), publicQuiz);
        assert.equal(previewUrlForMaterial("quiz", publicQuiz), publicQuiz);
        assert.equal(materialValueFromInput("quiz", editorQuiz), null);
        assert.equal(previewUrlForMaterial("quiz", editorQuiz), null);
    });
});
