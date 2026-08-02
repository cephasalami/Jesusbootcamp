// Read-only scan of exported Mailchimp template HTML for class access links.
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";

const root = process.argv[2];
if (!root) throw new Error("Pass the extracted Mailchimp templates directory");

async function filesBelow(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) files.push(...(await filesBelow(path)));
        else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) files.push(path);
    }
    return files;
}

const mergePattern = (field) =>
    new RegExp(
        String.raw`(?:\*|%2a|&#42;)(?:\||%7c|&#124;)${field}(?:\||%7c|&#124;)(?:\*|%2a|&#42;)`,
        "gi"
    );
const classLinkPattern = /https?:\/\/jesusbootcamp\.org\/class\/[a-z0-9-]+(?:\?[^"'\s<]*)?/gi;

const results = [];
for (const path of await filesBelow(root)) {
    const html = await readFile(path, "utf8");
    const classLinks = [...new Set((html.match(classLinkPattern) ?? []).map((url) => url.replaceAll("&amp;", "&")))];
    const emailMergeCount = (html.match(mergePattern("EMAIL")) ?? []).length;
    const ctokenMergeCount = (html.match(mergePattern("CTOKEN")) ?? []).length;
    if (classLinks.length || emailMergeCount || ctokenMergeCount) {
        results.push({
            file: basename(path),
            emailMergeCount,
            ctokenMergeCount,
            classLinks,
        });
    }
}

const summary = {
    templatesScanned: (await filesBelow(root)).length,
    templatesWithClassLinks: results.filter((result) => result.classLinks.length).length,
    emailMergeOccurrences: results.reduce((sum, result) => sum + result.emailMergeCount, 0),
    ctokenMergeOccurrences: results.reduce((sum, result) => sum + result.ctokenMergeCount, 0),
    classLinksWithoutCtoken: results.flatMap((result) =>
        result.classLinks
            .filter((url) => !/[?&]t=(?:\*|%2a)(?:\||%7c)CTOKEN(?:\||%7c)(?:\*|%2a)/i.test(url))
            .map((url) => ({ file: result.file, url }))
    ),
};

console.log(JSON.stringify({ summary, templates: results }, null, 2));
