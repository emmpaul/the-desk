<?php

namespace App\Http\Controllers\Settings;

use App\Data\SessionData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class SecurityController extends Controller
{
    /**
     * Show the user's security settings page.
     */
    public function edit(TwoFactorAuthenticationRequest $request): Response
    {
        $props = [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'sessions' => $this->activeSessions($request),
        ];

        return Inertia::render('settings/Security', $props);
    }

    /**
     * List the user's active sessions, current session first, then most recent.
     *
     * @return array<int, SessionData>
     */
    private function activeSessions(TwoFactorAuthenticationRequest $request): array
    {
        $currentSessionId = $request->session()->getId();

        return DB::table('sessions')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('last_activity')
            ->get()
            ->map(fn (\stdClass $session): SessionData => SessionData::fromSession($session, $currentSessionId))
            ->sortByDesc('isCurrentDevice')
            ->values()
            ->all();
    }

    /**
     * Update the user's password.
     */
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password' => $request->password,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password updated.')]);

        return back();
    }
}
