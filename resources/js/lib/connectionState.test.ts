import { describe, expect, it } from 'vitest';
import { connectionPill } from '@/lib/connectionState';

describe('connectionPill', () => {
    it('reads a live socket as online', () => {
        expect(connectionPill('connected')).toBe('online');
    });

    it('reads every non-connected status as reconnecting', () => {
        expect(connectionPill('connecting')).toBe('reconnecting');
        expect(connectionPill('reconnecting')).toBe('reconnecting');
        expect(connectionPill('disconnected')).toBe('reconnecting');
        expect(connectionPill('failed')).toBe('reconnecting');
    });
});
