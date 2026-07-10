/**
 * A recorded security-relevant account event as shown on the Security settings
 * page. Mirrors the `App\Data\SecurityEventData` DTO. `isNewDevice` flags a
 * sign-in from an IP and browser not seen on a prior sign-in.
 */
export type SecurityActivityEvent = {
    id: string;
    type: string;
    label: string;
    ipAddress: string | null;
    browser: string;
    platform: string;
    isNewDevice: boolean;
    occurredAt: string;
};
