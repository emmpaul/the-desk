import { RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import vueParser from 'vue-eslint-parser';
import rule, { isExemptFile } from './no-raw-button.js';

describe('isExemptFile', () => {
    it('exempts files under components/ui/', () => {
        expect(
            isExemptFile('/app/resources/js/components/ui/button/Button.vue'),
        ).toBe(true);
    });

    it('does not exempt other component files', () => {
        expect(
            isExemptFile('/app/resources/js/components/MessageActions.vue'),
        ).toBe(false);
        expect(isExemptFile('/app/resources/js/pages/channels/Show.vue')).toBe(
            false,
        );
    });
});

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: vueParser,
        ecmaVersion: 2022,
        sourceType: 'module',
    },
});

ruleTester.run('no-raw-button', rule, {
    valid: [
        {
            // The `<Button>` primitive is fine anywhere.
            filename: 'resources/js/components/MessageActions.vue',
            code: '<template><Button variant="ghost">Go</Button></template>',
        },
        {
            // Raw `<button>` is allowed inside the shadcn primitives.
            filename: 'resources/js/components/ui/button/Button.vue',
            code: '<template><button type="button">Go</button></template>',
        },
    ],
    invalid: [
        {
            filename: 'resources/js/components/MessageActions.vue',
            code: '<template><button type="button" aria-label="Pin">Pin</button></template>',
            errors: [{ messageId: 'preferButton' }],
        },
        {
            filename: 'resources/js/pages/channels/Show.vue',
            code: '<template><div><button>One</button><button>Two</button></div></template>',
            errors: [
                { messageId: 'preferButton' },
                { messageId: 'preferButton' },
            ],
        },
    ],
});
