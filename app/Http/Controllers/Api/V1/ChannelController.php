<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Channels\ArchiveChannel;
use App\Actions\Channels\CreateChannel;
use App\Enums\AuditAction;
use App\Enums\ChannelVisibility;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreChannelRequest;
use App\Http\Resources\Api\V1\ChannelResource;
use App\Models\Channel;
use App\Models\User;
use App\Support\AuditRecorder;
use App\Support\Integrations\BotChannelAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ChannelController extends Controller
{
    /**
     * List the channels the bot belongs to, in its own team.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $bot = $request->user();
        assert($bot instanceof User);

        $channels = Channel::query()
            ->where('team_id', $bot->owner_team_id)
            ->whereHas('channelMembers', fn ($query) => $query->where('user_id', $bot->id))
            ->orderBy('name')
            ->get();

        return ChannelResource::collection($channels);
    }

    /**
     * Create a channel in the bot's team; the bot is seeded as its first member.
     */
    public function store(StoreChannelRequest $request, CreateChannel $createChannel, AuditRecorder $recorder): JsonResponse
    {
        $bot = $request->user();
        assert($bot instanceof User);

        $team = $bot->ownerTeam()->firstOrFail();

        $channel = $createChannel->handle(
            team: $team,
            name: $request->validated('name'),
            visibility: ChannelVisibility::from($request->validated('visibility')),
            creator: $bot,
            topic: $request->validated('topic'),
        );

        $recorder->record($team, $bot, AuditAction::ChannelCreated, $channel, [
            'channel_name' => $channel->name,
        ]);

        return ChannelResource::make($channel)->response()->setStatusCode(201);
    }

    /**
     * Show a single channel the bot belongs to.
     */
    public function show(Request $request, Channel $channel): ChannelResource
    {
        $bot = $request->user();
        assert($bot instanceof User);

        BotChannelAccess::assert($bot, $channel);

        return ChannelResource::make($channel);
    }

    /**
     * Archive a channel the bot created.
     *
     * The human `archive` gate leans on team membership (which a bot lacks), so
     * the API grounds it on the bot being the channel's creator, keeping the same
     * "not #general / not a DM / not already archived" guards.
     */
    public function archive(Request $request, Channel $channel, ArchiveChannel $archiveChannel, AuditRecorder $recorder): ChannelResource
    {
        $bot = $request->user();
        assert($bot instanceof User);

        BotChannelAccess::assert($bot, $channel);

        abort_unless(
            ! $channel->isGeneral()
                && ! $channel->isArchived()
                && ! $channel->isDirectMessage()
                && $channel->created_by === $bot->id,
            403,
        );

        $channel = $archiveChannel->handle($channel);

        $recorder->record($bot->ownerTeam()->firstOrFail(), $bot, AuditAction::ChannelArchived, $channel, [
            'channel_name' => $channel->name,
        ]);

        return ChannelResource::make($channel);
    }
}
