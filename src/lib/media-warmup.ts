export type ConnectionHint = {
    saveData?: boolean;
    effectiveType?: string;
};

/**
 * Decide whether the browser may begin buffering a class podcast in the
 * background. `preload="auto"` is a browser hint rather than an exact byte
 * budget, so never use it when the learner has enabled Data Saver or reported
 * a 2G connection.
 */
export function shouldPrebufferPodcast(connection?: ConnectionHint): boolean {
    if (connection?.saveData) return false;
    return connection?.effectiveType !== "slow-2g" && connection?.effectiveType !== "2g";
}
