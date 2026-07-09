<?php

namespace App\Http\Controllers\Channels;

use App\Actions\Channels\SetChannelStar;
use App\Http\Controllers\Controller;
use App\Http\Requests\Channels\UpdateChannelStarRequest;
use App\Models\Channel;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;

class ChannelStarController extends Controller
{
    /**
     * Star or unstar the channel for the current user.
     *
     * Redirects back and lets Inertia recompute the shared `channels` prop so the
     * sidebar's "Starred" section reflects the change without a full reload.
     */
    public function update(UpdateChannelStarRequest $request, Team $team, Channel $channel, SetChannelStar $setChannelStar): RedirectResponse
    {
        $setChannelStar->handle(
            channel: $channel,
            user: $request->user(),
            starred: $request->boolean('starred'),
        );

        return back();
    }
}
