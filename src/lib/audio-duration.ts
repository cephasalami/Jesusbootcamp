/**
 * Read an audio duration from a small sample of the file itself. Google Drive
 * supplies duration metadata for video, but not for the M4A/MP3 podcast files.
 * M4A stores its movie header near either end of the file; MP3 usually stores
 * its frame count in the first frame's Xing/Info header.
 */

function readUint32(bytes: Uint8Array, offset: number): number | null {
    if (offset < 0 || offset + 4 > bytes.length) return null;
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset);
}

function readUint64(bytes: Uint8Array, offset: number): number | null {
    const high = readUint32(bytes, offset);
    const low = readUint32(bytes, offset + 4);
    if (high == null || low == null) return null;
    const value = high * 2 ** 32 + low;
    return Number.isSafeInteger(value) ? value : null;
}

/** Read the mvhd atom shared by MP4/M4A containers. */
export function readMp4DurationMs(bytes: Uint8Array): number | null {
    for (let typeOffset = 4; typeOffset + 4 <= bytes.length; typeOffset++) {
        if (
            bytes[typeOffset] !== 0x6d || // m
            bytes[typeOffset + 1] !== 0x76 || // v
            bytes[typeOffset + 2] !== 0x68 || // h
            bytes[typeOffset + 3] !== 0x64 // d
        ) {
            continue;
        }

        const boxStart = typeOffset - 4;
        const boxSize = readUint32(bytes, boxStart);
        if (boxSize == null || boxSize < 28 || boxStart + boxSize > bytes.length) continue;

        const version = bytes[typeOffset + 4];
        const timescale = readUint32(bytes, typeOffset + (version === 1 ? 24 : 16));
        const duration = version === 1
            ? readUint64(bytes, typeOffset + 28)
            : readUint32(bytes, typeOffset + 20);
        if (!timescale || !duration || timescale <= 0 || duration <= 0) continue;

        return Math.round((duration * 1000) / timescale);
    }
    return null;
}

type MpegFrame = {
    bitrateKbps: number;
    sampleRate: number;
    samplesPerFrame: number;
    sideInfoBytes: number;
};

function readMpegFrame(bytes: Uint8Array, offset: number): MpegFrame | null {
    if (offset + 4 > bytes.length || bytes[offset] !== 0xff || (bytes[offset + 1] & 0xe0) !== 0xe0) {
        return null;
    }

    const versionBits = (bytes[offset + 1] >> 3) & 0x03;
    const layerBits = (bytes[offset + 1] >> 1) & 0x03;
    const bitrateIndex = (bytes[offset + 2] >> 4) & 0x0f;
    const sampleRateIndex = (bytes[offset + 2] >> 2) & 0x03;
    const channelMode = (bytes[offset + 3] >> 6) & 0x03;
    if (versionBits === 1 || layerBits !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
        return null;
    }

    const mpeg1 = versionBits === 3;
    const bitrateTable = mpeg1
        ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
        : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
    const baseSampleRates = [44100, 48000, 32000];
    const sampleRate = baseSampleRates[sampleRateIndex] / (versionBits === 2 ? 2 : mpeg1 ? 1 : 4);

    return {
        bitrateKbps: bitrateTable[bitrateIndex],
        sampleRate,
        samplesPerFrame: mpeg1 ? 1152 : 576,
        sideInfoBytes: mpeg1 ? (channelMode === 3 ? 17 : 32) : (channelMode === 3 ? 9 : 17),
    };
}

/** Read an MP3's precise Xing/Info frame count, with a CBR fallback. */
export function readMp3DurationMs(bytes: Uint8Array, fileSize: number): number | null {
    for (let offset = 0; offset + 4 <= bytes.length; offset++) {
        const frame = readMpegFrame(bytes, offset);
        if (!frame) continue;

        const xingOffset = offset + 4 + frame.sideInfoBytes;
        const marker = String.fromCharCode(...bytes.subarray(xingOffset, xingOffset + 4));
        const flags = readUint32(bytes, xingOffset + 4);
        if ((marker === "Xing" || marker === "Info") && flags != null && (flags & 0x01) !== 0) {
            const frames = readUint32(bytes, xingOffset + 8);
            if (frames && frames > 0) {
                return Math.round((frames * frame.samplesPerFrame * 1000) / frame.sampleRate);
            }
        }

        // A CBR MP3's size and first-frame bitrate determine its duration. It
        // is only a fallback when the file does not carry an exact frame count.
        if (fileSize > offset && frame.bitrateKbps > 0) {
            return Math.round(((fileSize - offset) * 8) / frame.bitrateKbps);
        }
    }
    return null;
}

export function readAudioDurationMs({
    firstBytes,
    lastBytes,
    fileSize,
    mimeType,
}: {
    firstBytes: Uint8Array;
    lastBytes: Uint8Array;
    fileSize: number;
    mimeType: string;
}): number | null {
    if (/^audio\/mpeg$/i.test(mimeType)) return readMp3DurationMs(firstBytes, fileSize);
    return readMp4DurationMs(firstBytes) ?? readMp4DurationMs(lastBytes);
}
