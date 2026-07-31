import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { bookDownloadFilename, getDownload } from "../src/config/products.ts";

describe("email PDF downloads", () => {
    test("allowlists the two email PDFs with clean attachment filenames", () => {
        const before = getDownload("before-we-begin");
        const why = getDownload("why-it-was-born");

        assert.equal(
            before?.downloadUrl,
            "https://mcusercontent.com/d0e3ae7aee09d6264267481c7/files/57165dd1-4035-79fa-7deb-976da2af8217/Before_We_Begin._From_Paul_Joseph.pdf"
        );
        assert.equal(bookDownloadFilename(before!), "Before-We-Begin.pdf");

        assert.equal(
            why?.downloadUrl,
            "https://mcusercontent.com/d0e3ae7aee09d6264267481c7/files/4f875004-60d1-9787-88a4-009578d5e61e/Why_the_ldquo_Jesus_Boot_Camp_rdquo_Was_Born.pdf"
        );
        assert.equal(bookDownloadFilename(why!), "Why-the-Jesus-Boot-Camp-Was-Born.pdf");
    });
});
