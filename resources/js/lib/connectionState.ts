import type { ConnectionStatus } from '@laravel/echo-vue';

/** The steady connection intent the masthead pill renders from. */
export type ConnectionIntent = 'online' | 'reconnecting';

/**
 * Collapse Echo's five-value {@link ConnectionStatus} into the two steady states
 * the UI cares about: a live socket is `online`, and every other status —
 * connecting, reconnecting, disconnected, or failed — reads as `reconnecting`,
 * since from the viewer's seat they are all "not delivering messages right now,
 * trying to recover". The transient "Back online" confirmation is a separate,
 * timer-driven concern owned by {@see useConnectionState}.
 */
export function connectionPill(status: ConnectionStatus): ConnectionIntent {
    return status === 'connected' ? 'online' : 'reconnecting';
}
