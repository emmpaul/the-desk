/**
 * Flags raw `<button>` elements in Vue templates outside `components/ui/`,
 * steering shared button styling onto the `<Button>` primitive (its variants,
 * sizes, focus ring, and `loading` affordance) rather than hand-rolled class
 * strings that drift over time. Genuinely bespoke controls (composer keys, the
 * reaction grid, menu items, card buttons) opt out per-occurrence with
 * `<!-- eslint-disable-next-line local/no-raw-button -- <reason> -->`.
 *
 * The shadcn-owned primitives under `components/ui/` legitimately render the
 * underlying `<button>`, so files there are exempt.
 */

const UI_DIRECTORY = 'components/ui/';

/**
 * Whether a file is exempt from the rule: the shadcn-owned `<Button>` / friends
 * under `components/ui/`, which own the one blessed raw `<button>`.
 *
 * @param {string} filename
 * @returns {boolean}
 */
export function isExemptFile(filename) {
    return filename.replaceAll('\\', '/').includes(UI_DIRECTORY);
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Use the `<Button>` primitive instead of a raw `<button>` element outside `components/ui/`.',
        },
        schema: [],
        messages: {
            preferButton:
                'Use the `<Button>` primitive (`@/components/ui/button`) instead of a raw `<button>`; it carries the shared variant, size, focus-ring, and loading behaviour. Genuinely bespoke controls may opt out with `<!-- eslint-disable-next-line local/no-raw-button -- reason -->`.',
        },
    },
    create(context) {
        if (isExemptFile(context.filename)) {
            return {};
        }

        const defineTemplateBodyVisitor =
            context.sourceCode.parserServices?.defineTemplateBodyVisitor;

        if (!defineTemplateBodyVisitor) {
            return {};
        }

        return defineTemplateBodyVisitor({
            "VElement[rawName='button']"(node) {
                context.report({
                    node: node.startTag,
                    messageId: 'preferButton',
                });
            },
        });
    },
};

export default rule;
