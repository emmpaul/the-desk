const HTML_ESCAPES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
};

function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

// http/https URLs, consuming everything up to whitespace. Any escaped `<`
// becomes `&lt;` before this runs, so it can never re-open a tag.
const URL_PATTERN = /\bhttps?:\/\/[^\s]+/gi;

// Punctuation that commonly trails a URL in prose and shouldn't be linked.
const TRAILING_PUNCTUATION = /[.,!?;:'")\]]+$/;

/**
 * Render a raw message body into safe HTML: HTML is escaped first (so user
 * input can never inject markup), then bare URLs are autolinked and newlines
 * are preserved as `<br>`. The result is intended for `v-html`.
 */
export function renderMessageBody(body: string): string {
    const escaped = escapeHtml(body);

    const linked = escaped.replace(URL_PATTERN, (match) => {
        const trailing = match.match(TRAILING_PUNCTUATION)?.[0] ?? '';
        const href = match.slice(0, match.length - trailing.length);

        return `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow" class="text-primary underline underline-offset-2 hover:no-underline">${href}</a>${trailing}`;
    });

    return linked.replace(/\n/g, '<br>');
}
