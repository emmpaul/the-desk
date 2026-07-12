import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateUuid } from '@/lib/uuid';

const UUID_V4 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateUuid', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('uses crypto.randomUUID when available', () => {
        const randomUUID = vi
            .fn()
            .mockReturnValue('11111111-1111-4111-8111-111111111111');
        vi.stubGlobal('crypto', { randomUUID });

        expect(generateUuid()).toBe('11111111-1111-4111-8111-111111111111');
        expect(randomUUID).toHaveBeenCalledOnce();
    });

    it('falls back to a valid v4 UUID when crypto.randomUUID is undefined', () => {
        vi.stubGlobal('crypto', {
            getRandomValues: (array: Uint8Array): Uint8Array => {
                for (let index = 0; index < array.length; index += 1) {
                    array[index] = index;
                }

                return array;
            },
        });

        const uuid = generateUuid();

        expect(uuid).toMatch(UUID_V4);
    });

    it('produces distinct fallback values across calls', () => {
        let seed = 0;
        vi.stubGlobal('crypto', {
            getRandomValues: (array: Uint8Array): Uint8Array => {
                for (let index = 0; index < array.length; index += 1) {
                    array[index] = (seed + index) % 256;
                }

                seed += 1;

                return array;
            },
        });

        expect(generateUuid()).not.toBe(generateUuid());
    });
});
