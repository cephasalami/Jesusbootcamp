import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readAudioDurationMs, readMp3DurationMs, readMp4DurationMs } from "../src/lib/audio-duration.ts";

function mp4MovieHeader(timescale: number, duration: number): Uint8Array {
    const bytes = new Uint8Array(28);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, 28);
    bytes.set([0x6d, 0x76, 0x68, 0x64], 4); // mvhd
    view.setUint32(20, timescale);
    view.setUint32(24, duration);
    return bytes;
}

describe("audio duration headers", () => {
    test("reads a real duration from an M4A/MP4 movie header", () => {
        assert.equal(readMp4DurationMs(mp4MovieHeader(48_000, 4_800_000)), 100_000);
    });

    test("finds an M4A header in the final range of a file", () => {
        assert.equal(
            readAudioDurationMs({
                firstBytes: new Uint8Array(),
                lastBytes: mp4MovieHeader(1_000, 75_000),
                fileSize: 40_000_000,
                mimeType: "audio/x-m4a",
            }),
            75_000
        );
    });

    test("reads an MP3 Xing frame count rather than trusting a label", () => {
        const bytes = new Uint8Array(48);
        bytes.set([0xff, 0xfb, 0x90, 0x00], 0); // MPEG-1 Layer III, 128kbps, 44.1kHz stereo
        bytes.set([0x58, 0x69, 0x6e, 0x67], 36); // Xing after 32-byte side information
        new DataView(bytes.buffer).setUint32(40, 1); // frame-count present
        new DataView(bytes.buffer).setUint32(44, 1_000);
        assert.equal(readMp3DurationMs(bytes, 1_000_000), Math.round((1_000 * 1_152 * 1_000) / 44_100));
    });
});
