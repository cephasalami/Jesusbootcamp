import { ShieldCheck, UserPlus } from "lucide-react";
import { Footnote, Panel, ScreenHeader } from "../../ui";
import EnrollForm from "./EnrollForm";
import styles from "../../tracking.module.css";

export const dynamic = "force-dynamic";

export default function EnrollScreen() {
  return (
    <>
      <ScreenHeader
        eyebrow="Enrol by hand"
        title="Add people you personally vouch for"
        subtitle="For the names Paul passes over directly. These contacts are added as confirmed subscribers and start the class sequence immediately — no confirmation email to click."
      />

      <Panel
        icon={<UserPlus size={18} />}
        title="Bulk enrolment"
        subtitle="Paste addresses separated by new lines, commas or spaces. Duplicates are ignored and re-enrolling someone is safe."
        wide
      >
        <EnrollForm />
      </Panel>

      <Panel
        icon={<ShieldCheck size={18} />}
        title="Why this screen exists"
        subtitle="It is not a shortcut around consent — it is the only correct path for someone added on their behalf."
        wide
      >
        <ul className={styles.ruleList}>
          <li>
            <strong>The public form is double opt-in.</strong> Someone who signs up at{" "}
            <code>/join</code> gets a confirmation email and stays unconfirmed until they click it.
            That is right for a stranger who chose to sign up.
          </li>
          <li>
            <strong>It is wrong for a hand-added contact.</strong> They never asked for anything, so
            they will not recognise a &ldquo;confirm your subscription&rdquo; email and almost none
            will click. Mailchimp will not run the class automation for an unconfirmed contact, so
            they receive nothing at all — which is exactly the &ldquo;they never got the
            emails&rdquo; problem.
          </li>
          <li>
            <strong>This screen adds them as confirmed</strong>, applies the course tag, issues their
            access token and starts their 90-day clock today. You are asserting a real relationship
            with each person.
          </li>
          <li>
            <strong>Only enrol people who genuinely expect this.</strong> Adding strangers here
            produces spam complaints, and complaints are what is currently keeping the mail out of
            inboxes. It is reachable only behind this dashboard&apos;s password for that reason.
          </li>
        </ul>
        <Footnote>
          Anyone already on the audience keeps their existing status — this never downgrades a
          confirmed subscriber, and re-running it on the same list is harmless.
        </Footnote>
      </Panel>
    </>
  );
}
