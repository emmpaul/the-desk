/**
 * Client-side twin of `User::isDndActive()` on the server: whether the viewer
 * is in do-not-disturb at a given instant, from the full configuration their
 * own `auth.user` prop carries.
 *
 * The chime gate needs this answer at message-arrival time, not at page-load
 * time — a pause that lapsed two minutes ago, or a quiet-hours window that
 * opened one minute ago, must take effect without waiting for a server
 * round-trip. Keep the semantics in lockstep with the server: start inclusive,
 * end exclusive, and a window whose end precedes its start wraps across
 * midnight.
 */
export function isDndActiveNow(
    dnd: App.Data.UserDndData | null | undefined,
    timeZone: string | null | undefined,
    at: Date = new Date(),
): boolean {
    if (!dnd) {
        return false;
    }

    if (dnd.until !== null && new Date(dnd.until) > at) {
        return true;
    }

    if (!dnd.scheduleEnabled || dnd.startsAt === null || dnd.endsAt === null) {
        return false;
    }

    const wallClock = wallClockIn(timeZone, at);

    if (dnd.startsAt <= dnd.endsAt) {
        return wallClock >= dnd.startsAt && wallClock < dnd.endsAt;
    }

    return wallClock >= dnd.startsAt || wallClock < dnd.endsAt;
}

/**
 * The `HH:MM` wall-clock reading of an instant in a zone, falling back to the
 * device's own zone when the given one is missing or not a valid IANA
 * identifier. The locale is pinned because this string is compared against the
 * stored schedule bounds, never shown to anyone.
 */
function wallClockIn(timeZone: string | null | undefined, at: Date): string {
    const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    };

    try {
        return at.toLocaleTimeString('en-GB', {
            ...options,
            timeZone: timeZone ?? undefined,
        });
    } catch {
        return at.toLocaleTimeString('en-GB', options);
    }
}
