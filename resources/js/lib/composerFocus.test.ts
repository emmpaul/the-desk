import { describe, expect, it } from 'vitest';
import { isInteractiveComposerTarget } from '@/lib/composerFocus';

type Node = { tagName: string; parentElement: Node | null };

/** Build a node chain from a leaf up to a card boundary, returning both ends. */
function chain(...tags: string[]): { boundary: Node; leaf: Node } {
    const boundary: Node = { tagName: 'DIV', parentElement: null };
    let node = boundary;

    for (const tagName of tags) {
        node = { tagName, parentElement: node };
    }

    return { boundary, leaf: node };
}

describe('isInteractiveComposerTarget', () => {
    it('treats a click on the card padding as non-interactive', () => {
        const { boundary, leaf } = chain('SPAN');

        expect(isInteractiveComposerTarget(leaf, boundary)).toBe(false);
    });

    it('treats a click on the card itself as non-interactive', () => {
        const { boundary } = chain();

        expect(isInteractiveComposerTarget(boundary, boundary)).toBe(false);
    });

    it('treats a click on the textarea as interactive', () => {
        const { boundary, leaf } = chain('TEXTAREA');

        expect(isInteractiveComposerTarget(leaf, boundary)).toBe(true);
    });

    it('treats a click on a toolbar button as interactive', () => {
        const { boundary, leaf } = chain('BUTTON');

        expect(isInteractiveComposerTarget(leaf, boundary)).toBe(true);
    });

    it('treats a click on an icon nested inside a button as interactive', () => {
        const { boundary, leaf } = chain('BUTTON', 'SVG', 'PATH');

        expect(isInteractiveComposerTarget(leaf, boundary)).toBe(true);
    });

    it('treats a click on the checkbox input as interactive', () => {
        const { boundary, leaf } = chain('LABEL', 'INPUT');

        expect(isInteractiveComposerTarget(leaf, boundary)).toBe(true);
    });

    it('stops at the boundary and does not inspect the card ancestors', () => {
        const outerButton: Node = { tagName: 'BUTTON', parentElement: null };
        const boundary: Node = { tagName: 'DIV', parentElement: outerButton };
        const leaf: Node = { tagName: 'SPAN', parentElement: boundary };

        expect(isInteractiveComposerTarget(leaf, boundary)).toBe(false);
    });

    it('treats a null target as non-interactive', () => {
        const { boundary } = chain();

        expect(isInteractiveComposerTarget(null, boundary)).toBe(false);
    });
});
