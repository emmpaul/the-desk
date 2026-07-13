import { describe, expect, it } from 'vitest';
import { parseXsrfToken } from '@/lib/uploadAttachment';

describe('parseXsrfToken', () => {
    it('extracts and URL-decodes the XSRF-TOKEN cookie', () => {
        expect(parseXsrfToken('XSRF-TOKEN=abc%3D%3D')).toBe('abc==');
    });

    it('finds the token among other cookies', () => {
        expect(
            parseXsrfToken('foo=1; XSRF-TOKEN=tok3n; laravel_session=xyz'),
        ).toBe('tok3n');
    });

    it('returns null when no token cookie is present', () => {
        expect(parseXsrfToken('foo=1; bar=2')).toBeNull();
        expect(parseXsrfToken('')).toBeNull();
    });
});
