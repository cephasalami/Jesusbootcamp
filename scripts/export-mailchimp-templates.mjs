// Requests, checks, and downloads a templates-only Mailchimp account export.
// The signed download URL is deliberately never printed.
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const apiKey = process.env.MAILCHIMP_API_KEY;
const server = process.env.MAILCHIMP_API_SERVER;
if (!apiKey || !server) throw new Error("Missing Mailchimp environment variables");

const headers = {
    Authorization: `apikey ${apiKey}`,
    "Content-Type": "application/json",
};
const apiBase = `https://${server}.api.mailchimp.com/3.0`;

async function fetchWithRetry(url, init) {
    let lastError;
    for (let attempt = 1; attempt <= 4; attempt++) {
        try {
            const response = await fetch(url, init);
            if (response.status < 500 && response.status !== 429) return response;
            lastError = new Error(`${response.status} from Mailchimp`);
        } catch (error) {
            lastError = error;
        }
        if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 300));
    }
    throw lastError;
}

async function api(path, init) {
    const response = await fetchWithRetry(`${apiBase}${path}`, { headers, ...init });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(`Mailchimp ${response.status}: ${body.detail ?? body.title ?? "request failed"}`);
    }
    return body;
}

const command = process.argv[2];
if (command === "start") {
    const result = await api("/account-exports", {
        method: "POST",
        body: JSON.stringify({ include_stages: ["templates"] }),
    });
    console.log(JSON.stringify({ exportId: result.export_id, started: result.started ?? null }, null, 2));
} else if (command === "status" || command === "download") {
    const exportId = process.argv[3];
    if (!/^\d+$/.test(String(exportId ?? ""))) throw new Error("A numeric export id is required");
    const result = await api(`/account-exports/${exportId}`);
    const ready = Boolean(result.finished && result.download_url);
    if (command === "status" || !ready) {
        console.log(JSON.stringify({ exportId: result.export_id, started: result.started ?? null, finished: result.finished ?? null, sizeInBytes: result.size_in_bytes ?? null, ready }, null, 2));
        if (!ready && command === "download") process.exitCode = 2;
    } else {
        const response = await fetchWithRetry(result.download_url);
        if (!response.ok) throw new Error(`Template export download returned ${response.status}`);
        const destination = join("C:\\tmp", `mailchimp-templates-${exportId}.zip`);
        await writeFile(destination, Buffer.from(await response.arrayBuffer()));
        console.log(JSON.stringify({ exportId: result.export_id, destination, sizeInBytes: result.size_in_bytes ?? null }, null, 2));
    }
} else {
    throw new Error("Use: start | status <export-id> | download <export-id>");
}
