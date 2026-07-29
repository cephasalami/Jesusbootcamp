// Confirms the quiz row's real behaviour against the RUNNING server, and that
// the manifest layer logs (not silently swallows) an /edit quiz link.
import { createHash } from "node:crypto";
import { parseManifestRows } from "../src/lib/manifest-parse.ts";

const KEY = process.env.MAILCHIMP_API_KEY;
const SERVER = process.env.MAILCHIMP_API_SERVER;
const AUD = process.env.MAILCHIMP_AUDIENCE_ID;
const H = { Authorization: `apikey ${KEY}`, "Content-Type": "application/json" };
const mc = `https://${SERVER}.api.mailchimp.com/3.0/lists/${AUD}`;
const hash = (e) => createHash("md5").update(e.trim().toLowerCase()).digest("hex");

const EMAIL = process.argv[2];
const TOKEN = process.argv[3];

const member = await (await fetch(`${mc}/members/${hash(EMAIL)}?fields=merge_fields`, { headers: H })).json();
console.log("live PARTNER value:", JSON.stringify(member.merge_fields?.PARTNER));

const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, "");
const page = async (slug) =>
    strip(await (await fetch(`http://localhost:3000/class/${slug}?t=${TOKEN}`)).text());

for (const slug of ["1", "2", "3", "4", "4a"]) {
    const h = await page(slug);
    console.log(
        `  class ${slug.padEnd(3)} quizRow=${String(h.includes("Quiz</span>")).padEnd(5)} ` +
        `takeQuiz=${String(h.includes("Take the Quiz")).padEnd(5)} ` +
        `formUrl=${String(/viewform|forms\.gle/.test(h)).padEnd(5)} ` +
        `editLeak=${/\/edit/.test(h)}`
    );
}

// Prove the /edit link produces a real, loud warning at manifest-parse time.
console.log("\n--- /edit detection on the live fixture ---");
const fixture = JSON.parse(Buffer.from(process.env.CLASS_MANIFEST_FIXTURE, "base64").toString("utf8"));
const { classes, warnings } = parseManifestRows(fixture.values);
console.log("warnings:");
for (const w of warnings) console.log("  •", w);
console.log("\nquizUrl per class:");
for (const c of classes) console.log(`  ${c.slug.padEnd(3)} ${c.quizUrl ?? "(none)"}`);
