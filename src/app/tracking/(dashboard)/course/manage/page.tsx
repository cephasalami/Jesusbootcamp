import { BookOpen, ShieldCheck } from "lucide-react";
import { getManifest, isManifestConfigured } from "@/lib/manifest";
import { BackLink, EmptySource, Footnote, Panel, ScreenHeader } from "../../../ui";
import CreateClassForm from "./CreateClassForm";
import MaterialLinkManager from "./MaterialLinkManager";
import styles from "./manage.module.css";

export const dynamic = "force-dynamic";

export default async function ManageCourseMaterialsScreen() {
    const classes = await getManifest();
    const lastClass = [...classes].sort((a, b) => b.sequencePosition - a.sequencePosition)[0] ?? null;

    return (
        <>
            <ScreenHeader
                eyebrow="Course materials"
                title="Manage classes and materials"
                subtitle="Create a class row, then paste each Google Drive material link, preview it and save it to the same learner-facing manifest."
            >
                <BackLink href="/tracking/course" label="Back to course access" />
            </ScreenHeader>

            {!isManifestConfigured ? (
                <EmptySource
                    title="Class manifest is not configured"
                    hint={
                        <>
                            Set <code>CLASS_MANIFEST_SHEET_ID</code> before adding course materials.
                        </>
                    }
                />
            ) : (
                <>
                    <Panel
                        icon={<BookOpen size={18} />}
                        title="Create a class"
                        subtitle="This adds a blank row to the manifest. The class stays as coming soon until you attach its materials."
                        wide
                    >
                        <CreateClassForm
                            lastClass={
                                lastClass
                                    ? {
                                        slug: lastClass.slug,
                                        sequencePosition: lastClass.sequencePosition,
                                        title: lastClass.title,
                                    }
                                    : null
                            }
                        />
                    </Panel>

                    {classes.length === 0 ? (
                        <EmptySource
                            title="No existing classes are available to edit"
                            hint="Create the first class above, or refresh after the manifest connection is restored."
                        />
                    ) : (
                        <Panel
                            icon={<BookOpen size={18} />}
                            title="Material link"
                            subtitle="Save one link at a time so it is clear which class material is changing."
                            wide
                        >
                            <MaterialLinkManager
                                classes={classes.map((klass) => ({ slug: klass.slug, title: klass.title }))}
                            />
                        </Panel>
                    )}
                </>
            )}

            <Panel
                icon={<ShieldCheck size={18} />}
                title="Before you save"
                subtitle="The class manifest remains the single source of truth for every learner-facing material."
                wide
            >
                <ul className={styles.notes}>
                    <li>Use a Google Drive file sharing link or its file ID for PDFs, videos, audio, slides and scripture notes.</li>
                    <li>Use a public share link for a quiz. Google Forms editor links are deliberately rejected.</li>
                    <li>The Google service account must have <strong>Editor</strong> access to the manifest Sheet for saves to succeed.</li>
                </ul>
                <Footnote>Previewing checks the exact link you pasted. Saving stores the normalised Drive file ID, not the long sharing URL.</Footnote>
            </Panel>
        </>
    );
}
