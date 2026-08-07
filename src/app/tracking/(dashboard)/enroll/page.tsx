import { UserPlus } from "lucide-react";
import { Footnote, Panel, ScreenHeader } from "../../ui";
import EnrollForm from "./EnrollForm";

export const dynamic = "force-dynamic";

export default function EnrollScreen() {
  return (
    <>
      <ScreenHeader
        eyebrow="Admin"
        title="Enrol someone by hand"
        subtitle="For people you personally know and are vouching for. They are added straight to the course without a confirmation step, so only use it for names you have actually been given."
      />

      <Panel
        icon={<UserPlus size={18} />}
        title="Add to the 90-day course"
        subtitle="Paste any number of addresses — commas, spaces or one per line all work. Up to 200 per batch."
        wide
      >
        <EnrollForm />
        <Footnote>
          Each person is added as a confirmed subscriber, tagged{" "}
          <code>jbc-course-start</code>, issued a class-access token, and has their drip clock
          started today. Anyone already on the audience keeps the status and start date they
          already have, so re-submitting a list is safe.
        </Footnote>
      </Panel>

      <Panel
        icon={<UserPlus size={18} />}
        title="Why this exists"
        subtitle="The reason not to use the public form for this."
        wide
      >
        <p>
          The <code>/join</code>{" "}form is double opt-in: it emails a confirmation link and nobody
          enters the class sequence until they click it. That is right for someone who signed
          themselves up, and wrong for someone added on their behalf — they never asked for the
          confirmation, do not recognise it, and so never click. They then sit unconfirmed
          forever and receive nothing, which is exactly the &ldquo;I added them and they got no
          emails&rdquo; problem.
        </p>
        <Footnote>
          This screen is the only path that skips confirmation, and it sits behind the dashboard
          password. Do not wire it to anything public.
        </Footnote>
      </Panel>
    </>
  );
}
