// The partnership CTA is wrapped in {{#unless is_partner}} so an existing
// monthly partner is never asked to "upgrade to partnership".
//
// The failure mode here is silent in BOTH directions and invisible in a send
// log, so it is worth pinning:
//
//   • a truthy value leaking through (notably the STRING "false", which
//     Handlebars treats as truthy) hides the ask from everyone, and the
//     partnership funnel quietly produces nothing
//   • a missing value shows the ask to paying partners, which reads as though
//     their giving was never noticed
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const partial = await readFile("emails/partials/partnership-cta.html", "utf8");

/**
 * Minimal stand-in for the one Handlebars helper this partial uses. SendGrid
 * renders the real thing; this asserts our BLOCK is shaped correctly and that
 * the value we feed it has the truthiness we expect.
 */
function renderUnless(template: string, values: Record<string, unknown>): string {
    return template.replace(
        /\{\{#unless (\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
        (_match, name: string, body: string) => (values[name] ? "" : body)
    );
}

describe("partnership CTA visibility", () => {
    test("the partial is wrapped in an is_partner guard", () => {
        assert.match(partial, /\{\{#unless is_partner\}\}/, "must be conditional, not unconditional");
        assert.match(partial, /\{\{\/unless\}\}/);
    });

    test("points at the real partner signup, not a placeholder", () => {
        assert.match(partial, /https:\/\/jesusbootcamp\.org\/partner\/join/);
        assert.match(partial, /Upgrade to partnership/);
    });

    test("a non-partner sees the ask", () => {
        const html = renderUnless(partial, { is_partner: false });
        assert.match(html, /Upgrade to partnership/);
    });

    test("a partner does NOT see the ask", () => {
        const html = renderUnless(partial, { is_partner: true });
        assert.doesNotMatch(html, /Upgrade to partnership/);
    });

    test("the STRING \"false\" would wrongly hide it — so we must never send one", () => {
        // Documents the trap rather than the code: Handlebars has no special
        // case for "false", so this asserts the truthiness we are relying on.
        const html = renderUnless(partial, { is_partner: "false" });
        assert.doesNotMatch(
            html,
            /Upgrade to partnership/,
            'a string "false" is truthy — the drip must pass a real boolean'
        );
    });

    test("an absent value shows the ask, so a wiring mistake fails visible", () => {
        const html = renderUnless(partial, {});
        assert.match(
            html,
            /Upgrade to partnership/,
            "showing it to everyone is the safer failure than showing it to nobody"
        );
    });
});
