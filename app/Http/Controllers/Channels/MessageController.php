<?php

namespace App\Http\Controllers\Channels;

use App\Actions\Channels\PostMessage;
use App\Http\Controllers\Controller;
use App\Http\Requests\Channels\PostMessageRequest;
use App\Models\Channel;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;

class MessageController extends Controller
{
    /**
     * Post a message to the channel.
     */
    public function store(PostMessageRequest $request, Team $team, Channel $channel, PostMessage $postMessage): RedirectResponse
    {
        $postMessage->handle(
            channel: $channel,
            author: $request->user(),
            body: $request->validated('body'),
            clientUuid: $request->validated('client_uuid'),
        );

        return to_route('channels.show', ['team' => $team->slug, 'channel' => $channel->slug]);
    }
}
