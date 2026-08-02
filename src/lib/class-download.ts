import type { FormatKey } from "./access";

const FORMAT_FILE_LABELS: Partial<Record<FormatKey, string>> = {
    pdf: "Class PDF",
    // A slash is not valid in a filename on common devices, so use a readable
    // equivalent while retaining the visible format name on the class page.
    scriptures: "Main Points and Scriptures",
};

function safeFilenamePart(value: string): string {
    return value
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * A stable, user-facing filename for a downloaded class handout. The same
 * value is used by the link and the proxy response so browsers never fall
 * back to the generic route name (`file`).
 */
export function classDownloadFilename(
    slug: string,
    title: string,
    format: FormatKey,
    extension: string
): string {
    const classTitle = safeFilenamePart(title) || `Class ${slug}`;
    const formatLabel = FORMAT_FILE_LABELS[format];
    const ext = extension ? (extension.startsWith(".") ? extension : `.${extension}`) : "";
    const suffix = formatLabel ? ` - ${formatLabel}` : "";

    return `JBC Class ${slug} - ${classTitle}${suffix}${ext}`;
}
