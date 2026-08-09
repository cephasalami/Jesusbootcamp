// Validation for a new row in the class manifest. This stays independent of
// Next and Google APIs so both the protected Server Action and tests enforce
// the same constraints.

export type NewManifestClass = {
    slug: string;
    sequencePosition: number;
    title: string;
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

    return { ok: true, value: { slug, sequencePosition, title } };
}
