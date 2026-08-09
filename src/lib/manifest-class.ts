// Validation for a new row in the class manifest. This stays independent of
// Next and Google APIs so both the protected Server Action and tests enforce
// the same constraints.
import {
    MATERIAL_LINK_FORMATS,
    MATERIAL_LINK_LABELS,
    materialValueFromInput,
    type MaterialLinkFormat,
} from "./material-link.ts";

export type NewManifestClass = {
    slug: string;
    sequencePosition: number;
    title: string;
    /** Normalised Drive file IDs or a public quiz URL, ready for Sheet storage. */
    materials: Partial<Record<MaterialLinkFormat, string>>;
};

export type NewManifestClassResult =
    | { ok: true; value: NewManifestClass }
    | { ok: false; error: string };

/**
 * Normalise and validate the three fields every manifest row needs. Slugs are
 * route segments, so keep them deliberately simple and stable; `4a` remains a
 * valid real-world example.
 */
export function validateNewManifestClass(input: {
    slug: string;
    sequencePosition: string;
    title: string;
    materials?: Partial<Record<MaterialLinkFormat, string>>;
}): NewManifestClassResult {
    const slug = String(input.slug ?? "").trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(slug)) {
        return {
            ok: false,
            error: "Class slug must use lowercase letters, numbers or hyphens (for example 5, 4a or bonus-1).",
        };
    }

    const sequenceText = String(input.sequencePosition ?? "").trim();
    if (!/^\d+$/.test(sequenceText)) {
        return { ok: false, error: "Release position must be a whole number of zero or greater." };
    }
    const sequencePosition = Number(sequenceText);
    if (!Number.isSafeInteger(sequencePosition) || sequencePosition > 99_999) {
        return { ok: false, error: "Release position must be a whole number from 0 to 99,999." };
    }

    const title = String(input.title ?? "").trim().replace(/\s+/g, " ");
    if (!title) return { ok: false, error: "Enter a title for the new class." };
    if (title.length > 160) return { ok: false, error: "Class title must be 160 characters or fewer." };
    // The row is entered by Google Sheets rather than stored as raw text so
    // numeric slugs/positions do not gain a visible leading apostrophe. Do not
    // allow an admin mistake to turn a title into a Sheet formula as a result.
    if (/^[=+\-@]/.test(title)) {
        return { ok: false, error: "Class title cannot begin with =, +, - or @." };
    }

    const materials: Partial<Record<MaterialLinkFormat, string>> = {};
    for (const format of MATERIAL_LINK_FORMATS) {
        const raw = String(input.materials?.[format] ?? "").trim();
        if (!raw) continue;
        const value = materialValueFromInput(format, raw);
        if (!value) {
            return {
                ok: false,
                error:
                    format === "quiz"
                        ? "Quiz must be a public http(s) link, not a Google Forms editor link."
                        : `${MATERIAL_LINK_LABELS[format]} must be a Google Drive file link or file ID.`,
            };
        }
        materials[format] = value;
    }

    return { ok: true, value: { slug, sequencePosition, title, materials } };
}
