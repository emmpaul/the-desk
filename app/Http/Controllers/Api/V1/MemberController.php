<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Channels\JoinChannel;
use App\Actions\Channels\RemoveChannelMember;
use App\Enums\AuditAction;
use App\Enums\ChannelVisibility;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\AddMemberRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\Channel;
use App\Models\User;
use App\Support\AuditRecorder;
use App\Support\Integrations\BotChannelAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MemberController extends Controller
{
    /**
     * List the members of a channel the bot belongs to.
     */
    public function index(Request $request, Channel $channel): AnonymousResourceCollection
    {
        $bot = $request->user();
        assert($bot instanceof User);

        BotChannelAccess::assert($bot, $channel);

        $members = $channel->members()->orderBy('name')->get();

        return UserResource::collection($members);
    }

    /**
     * Add a team member to one of the bot's private channels.
     */
    public function store(AddMemberRequest $request, Channel $channel, JoinChannel $joinChannel, AuditRecorder $recorder): JsonResponse
    {
        $bot = $request->user();
        assert($bot instanceof User);

        $user = User::findOrFail((string) $request->validated('user_id'));

        $joinChannel->handle($channel, $user);

        $recorder->record($bot->ownerTeam()->firstOrFail(), $bot, AuditAction::ChannelMemberAdded, $channel, [
            'channel_name' => $channel->name,
            'member_name' => $user->name,
        ]);

        return UserResource::make($user)->response()->setStatusCode(201);
    }

    /**
     * Remove a member from one of the bot's private channels.
     */
    public function destroy(Request $request, Channel $channel, User $user, RemoveChannelMember $removeChannelMember, AuditRecorder $recorder): JsonResponse
    {
        $bot = $request->user();
        assert($bot instanceof User);

        BotChannelAccess::assert($bot, $channel);
        abort_unless($channel->visibility === ChannelVisibility::Private, 403);
        abort_unless($channel->channelMembers()->where('user_id', $user->id)->exists(), 404);

        $removeChannelMember->handle($channel, $user);

        $recorder->record($bot->ownerTeam()->firstOrFail(), $bot, AuditAction::ChannelMemberRemoved, $channel, [
            'channel_name' => $channel->name,
            'member_name' => $user->name,
        ]);

        return response()->json(null, 204);
    }
}
