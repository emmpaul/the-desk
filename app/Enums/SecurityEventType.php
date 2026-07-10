<?php

namespace App\Enums;

enum SecurityEventType: string
{
    case LoggedIn = 'logged_in';
    case LoggedOut = 'logged_out';
    case PasswordChanged = 'password_changed';
    case PasswordReset = 'password_reset';
    case TwoFactorEnabled = 'two_factor_enabled';
    case TwoFactorDisabled = 'two_factor_disabled';
    case TwoFactorConfirmed = 'two_factor_confirmed';
    case RecoveryCodesGenerated = 'recovery_codes_generated';

    /**
     * Get the human-readable label shown in the activity log.
     */
    public function label(): string
    {
        return match ($this) {
            self::LoggedIn => 'Signed in',
            self::LoggedOut => 'Signed out',
            self::PasswordChanged => 'Password changed',
            self::PasswordReset => 'Password reset',
            self::TwoFactorEnabled => 'Two-factor authentication enabled',
            self::TwoFactorDisabled => 'Two-factor authentication disabled',
            self::TwoFactorConfirmed => 'Two-factor authentication confirmed',
            self::RecoveryCodesGenerated => 'Recovery codes generated',
        };
    }
}
