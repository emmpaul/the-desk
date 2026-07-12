/**
 * Generate a RFC 4122 version 4 UUID.
 *
 * Prefers the native `crypto.randomUUID()`, which is only available in a
 * secure context (HTTPS, or `http://localhost` / `http://127.0.0.1`). When the
 * app is served over plain HTTP on a custom host, `crypto.randomUUID` is
 * `undefined`, so we fall back to a `crypto.getRandomValues()`-based v4 UUID.
 */
export function generateUuid(): string {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    const bytes = crypto.getRandomValues(new Uint8Array(16));

    // Set the version (4) and variant (RFC 4122) bits.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex: string[] = [];

    for (let index = 0; index < bytes.length; index += 1) {
        hex.push(bytes[index].toString(16).padStart(2, '0'));
    }

    return (
        `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-` +
        `${hex[4]}${hex[5]}-` +
        `${hex[6]}${hex[7]}-` +
        `${hex[8]}${hex[9]}-` +
        `${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`
    );
}
