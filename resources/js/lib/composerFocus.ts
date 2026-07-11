/**
 * Element tags that carry their own click behaviour inside the composer card —
 * the send/attachment/schedule buttons, the "also send to channel" checkbox,
 * and the textarea itself. A click landing on (or inside) any of these must run
 * that control's own action and keep its native focus/caret handling.
 */
const INTERACTIVE_TAGS = new Set([
    'BUTTON',
    'INPUT',
    'TEXTAREA',
    'SELECT',
    'A',
    'LABEL',
]);

/** The minimal slice of `Element` this predicate walks — the DOM node chain. */
type ClickNode = {
    tagName: string;
    parentElement: ClickNode | null;
};

/**
 * Whether a click that originated on `target` should defer to an interactive
 * control rather than being redirected into the composer textarea.
 *
 * Walks the ancestor chain from `target` up to — but not including — the card
 * `boundary`, treating the click as interactive when any node along the way is a
 * button, input, textarea, select, link, or label. Clicks on the card's own
 * padding or whitespace reach the boundary without matching, so they fall
 * through to focus the textarea instead.
 */
export function isInteractiveComposerTarget(
    target: ClickNode | null,
    boundary: ClickNode,
): boolean {
    let node: ClickNode | null = target;

    while (node && node !== boundary) {
        if (INTERACTIVE_TAGS.has(node.tagName)) {
            return true;
        }

        node = node.parentElement;
    }

    return false;
}
