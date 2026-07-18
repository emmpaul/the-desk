<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Channels\ToggleReaction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\AddReactionRequest;
use App\Models\Channel;
use App\Models\Message;
use App\Models\User;
use App\Support\Integrations\BotChannelAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReactionController extends Controller
{
    /**
     * Add the bot's reaction to a message (idempotent — re-adding is a no-op).
     */
    public function store(AddReactionRequest $request, Channel $channel, Message $message, ToggleReaction $toggleReaction): JsonResponse
    {
        $bot = $request->user();
        assert($bot instanceof User);

        $emoji = (string) $request->validated('emoji');

        if (! $this->hasReaction($message, $bot, $emoji)) {
            $toggleReaction->handle($channel, $message, $bot, $emoji);
        }

        return response()->json(null, 204);
    }

    /**
     * Remove the bot's reaction from a message (idempotent — a missing reaction
     * is a no-op).
     */
    public function destroy(Request $request, Channel $channel, Message $message, ToggleReaction $toggleReaction): JsonResponse
    {
        $bot = $request->user();
        assert($bot instanceof User);

        BotChannelAccess::assert($bot, $channel);
        abort_unless($message->channel_id === $channel->id, 404);
        abort_unless(Gate::allows('postMessage', $channel) && ! $message->isSystem(), 403);

        $emoji = (string) $request->route('emoji');

        if ($this->hasReaction($message, $bot, $emoji)) {
            $toggleReaction->handle($channel, $message, $bot, $emoji);
        }

        return response()->json(null, 204);
    }

    /**
     * Whether the bot already reacted to the message with the given emoji.
     */
    private function hasReaction(Message $message, User $bot, string $emoji): bool
    {
        return $message->reactions()
            ->where('user_id', $bot->id)
            ->where('emoji', $emoji)
            ->exists();
    }
}
