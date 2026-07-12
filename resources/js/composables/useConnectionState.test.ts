import type { ConnectionStatus } from '@laravel/echo-vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';

const status = ref<ConnectionStatus>('connected');

vi.mock('@laravel/echo-vue', () => ({
    useConnectionStatus: () => status,
}));

import {
    BACK_ONLINE_MS,
    useConnectionState,
} from '@/composables/useConnectionState';
import type { ConnectionState } from '@/composables/useConnectionState';

/** Run the composable in a disposable scope, exposing it and its teardown. */
function harness(initial: ConnectionStatus = 'connected'): {
    connection: ConnectionState;
    unmount: () => void;
} {
    status.value = initial;
    const scope = effectScope();
    let connection!: ConnectionState;

    scope.run(() => {
        connection = useConnectionState();
    });

    return { connection, unmount: () => scope.stop() };
}

describe('useConnectionState', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        status.value = 'connected';
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('reports online while the socket is connected', () => {
        const { connection, unmount } = harness('connected');

        expect(connection.isOnline.value).toBe(true);
        expect(connection.pill.value).toBeNull();

        unmount();
    });

    it('shows the reconnecting pill while the socket is down', async () => {
        const { connection, unmount } = harness('connected');

        status.value = 'disconnected';
        await Promise.resolve();

        expect(connection.isOnline.value).toBe(false);
        expect(connection.pill.value).toBe('reconnecting');

        unmount();
    });

    it('reports a first connect as not a reconnect, without a back-online pill', async () => {
        const onConnected = vi.fn();
        const { connection, unmount } = harness('disconnected');
        connection.onConnected(onConnected);

        // Loading offline then connecting for the first time still fires so a
        // rehydrated queue can flush, but flagged as not a reconnect.
        status.value = 'connected';
        await Promise.resolve();

        expect(onConnected).toHaveBeenCalledOnce();
        expect(onConnected).toHaveBeenCalledWith({ isReconnect: false });
        expect(connection.pill.value).toBeNull();

        unmount();
    });

    it('fires onConnected as a reconnect and shows the back-online pill on recovery', async () => {
        const onConnected = vi.fn();
        const { connection, unmount } = harness('connected');
        connection.onConnected(onConnected);

        status.value = 'disconnected';
        await Promise.resolve();
        status.value = 'connected';
        await Promise.resolve();

        expect(onConnected).toHaveBeenCalledOnce();
        expect(onConnected).toHaveBeenCalledWith({ isReconnect: true });
        expect(connection.pill.value).toBe('back-online');

        // The confirmation is transient — it clears after the window elapses.
        vi.advanceTimersByTime(BACK_ONLINE_MS);
        expect(connection.pill.value).toBeNull();

        unmount();
    });

    it('drops back to reconnecting if the socket falls over again mid-window', async () => {
        const { connection, unmount } = harness('connected');

        status.value = 'disconnected';
        await Promise.resolve();
        status.value = 'connected';
        await Promise.resolve();
        expect(connection.pill.value).toBe('back-online');

        status.value = 'reconnecting';
        await Promise.resolve();
        expect(connection.pill.value).toBe('reconnecting');

        unmount();
    });
});
