<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Events\UserProfileUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateDndScheduleRequest;
use Illuminate\Http\RedirectResponse;

class DndScheduleController extends Controller
{
    /**
     * Set the current user's recurring quiet-hours window.
     *
     * Enabling writes the window it was given; disabling flips the switch but
     * keeps the stored bounds, so re-enabling later remembers them. Either way
     * the broadcast lets teammates' open clients repaint the DND badge — a
     * window that covers this very moment flips the flag right now.
     */
    public function update(UpdateDndScheduleRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = $request->user();

        $changes = ['dnd_schedule_enabled' => (bool) $validated['enabled']];

        if (isset($validated['starts_at'], $validated['ends_at'])) {
            $changes['dnd_starts_at'] = $validated['starts_at'];
            $changes['dnd_ends_at'] = $validated['ends_at'];
        }

        $user->forceFill($changes)->save();

        event(new UserProfileUpdated($user));

        return back();
    }
}
