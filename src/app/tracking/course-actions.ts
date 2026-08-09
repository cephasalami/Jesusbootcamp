"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { TRACKING_COOKIE, verifySessionToken } from "@/lib/tracking-auth";
import { createManifestClass, updateManifestMaterialLink } from "@/lib/manifest";
import { validateNewManifestClass } from "@/lib/manifest-class";
import {
    MATERIAL_LINK_FORMATS,
    materialValueFromInput,
    type MaterialLinkFormat,
} from "@/lib/material-link";

export type SaveMaterialLinkState = { ok: true; value: string } | { ok: false; error: string };
export type CreateClassState = { ok: true; slug: string } | { ok: false; error: string };

/**
 * Every dashboard mutation verifies the signed session itself. Server Actions
 * can receive direct POSTs, so the route layout's UI gate is not sufficient.
 */
export async function saveCourseMaterialLink(input: {
    classSlug: string;
    format: string;
    link: string;
}): Promise<SaveMaterialLinkState> {
    const cookieStore = await cookies();
    if (!verifySessionToken(cookieStore.get(TRACKING_COOKIE)?.value)) {
        return { ok: false, error: "Your dashboard session has expired. Sign in again before saving." };
    }

    const classSlug = String(input?.classSlug ?? "").trim();
    const format = String(input?.format ?? "") as MaterialLinkFormat;
    const link = String(input?.link ?? "").trim();
    if (!classSlug || !MATERIAL_LINK_FORMATS.includes(format)) {
        return { ok: false, error: "Choose a class and a material type before saving." };
    }

    const value = materialValueFromInput(format, link);
    if (!value) {
        return {
            ok: false,
            error:
                format === "quiz"
                    ? "Paste a public http(s) quiz link, not a Google Forms editor link."
                    : "Paste a Google Drive file link or a valid Google Drive file ID.",
        };
    }

    const result = await updateManifestMaterialLink({ classSlug, format, value });
    if (!result.ok) return result;

    // The page currently reads dynamically, but revalidating makes the newly
    // saved material visible promptly if its rendering strategy changes later.
    revalidatePath("/tracking/course");
    revalidatePath("/tracking/course/manage");
    revalidatePath(`/class/${encodeURIComponent(classSlug)}`);
    return { ok: true, value };
}

/** Append a validated, blank-material class row to the single source-of-truth manifest. */
export async function createCourseClass(input: {
    slug: string;
    sequencePosition: string;
    title: string;
    materials: Partial<Record<MaterialLinkFormat, string>>;
}): Promise<CreateClassState> {
    const cookieStore = await cookies();
    if (!verifySessionToken(cookieStore.get(TRACKING_COOKIE)?.value)) {
        return { ok: false, error: "Your dashboard session has expired. Sign in again before creating a class." };
    }

    const parsed = validateNewManifestClass({
        slug: String(input?.slug ?? ""),
        sequencePosition: String(input?.sequencePosition ?? ""),
        title: String(input?.title ?? ""),
        materials: input?.materials ?? {},
    });
    if (!parsed.ok) return parsed;

    const result = await createManifestClass(parsed.value);
    if (!result.ok) return result;

    revalidatePath("/tracking/course");
    revalidatePath("/tracking/course/manage");
    return { ok: true, slug: parsed.value.slug };
}
