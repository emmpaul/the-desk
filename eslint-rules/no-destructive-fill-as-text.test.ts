import { describe, expect, it } from 'vitest';
import { findDestructiveTextUtilities } from './no-destructive-fill-as-text.js';

describe('findDestructiveTextUtilities', () => {
    it('flags the bare fill utility with the accessible text token', () => {
        expect(
            findDestructiveTextUtilities('flex text-xs text-destructive'),
        ).toEqual([
            {
                start: 13,
                original: 'text-destructive',
                suggestion: 'text-destructive-text',
            },
        ]);
    });

    it('reports every occurrence in a class string', () => {
        expect(
            findDestructiveTextUtilities(
                'text-destructive hover:text-destructive focus:text-destructive',
            ),
        ).toHaveLength(3);
    });

    it('keeps variant, important and opacity modifiers around the utility', () => {
        const variants = findDestructiveTextUtilities(
            "data-[variant=destructive]:text-destructive *:[svg]:!text-destructive *:data-[slot=alert-description]:text-destructive/90",
        );

        expect(variants).toHaveLength(3);
        expect(variants.map((match) => match.original)).toEqual([
            'text-destructive',
            'text-destructive',
            'text-destructive',
        ]);
    });

    it('leaves the accessible text token alone', () => {
        expect(
            findDestructiveTextUtilities(
                'text-destructive-text hover:text-destructive-text',
            ),
        ).toEqual([]);
    });

    it('leaves the on-fill foreground token alone', () => {
        expect(
            findDestructiveTextUtilities(
                'bg-destructive text-destructive-foreground',
            ),
        ).toEqual([]);
    });

    it('leaves non-text destructive utilities alone', () => {
        expect(
            findDestructiveTextUtilities(
                'bg-destructive/10 border-destructive/25 ring-destructive',
            ),
        ).toEqual([]);
    });

    it('ignores utilities that merely end in the same word', () => {
        expect(
            findDestructiveTextUtilities('context-destructive'),
        ).toEqual([]);
    });
});
