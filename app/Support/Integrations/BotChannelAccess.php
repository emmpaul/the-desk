<?php

declare(strict_types=1);

namespace App\Support\Integrations;

use App\Models\Channel;
use App\Models\User;
use App\Policies\ChannelPolicy;

/**
 * The single authorization primitive for the public API: a bot may only act on
 * a channel that belongs to its own team and that it is a member of. This is the
 * membership gate the whole surface leans on — a bot removed from a channel (or
 * pointed at another team's channel id) is refused as if the channel does not
 * exist (404), never leaking its existence.
 *
 * Human web gates such as {@see ChannelPolicy::view()} lean on
 * `belongsToTeam`, which a bot fails by construction (it has no team_members
 * pivot), so the API cannot reuse them for visibility and grounds access on
 * channel membership + `owner_team_id` instead.
 */
class BotChannelAccess
{
    /**
     * Whether the bot may see and act within the channel at all.
     */
    public static function allows(User $bot, Channel $channel): bool
    {
        return $channel->team_id === $bot->owner_team_id
            && $channel->channelMembers()->where('user_id', $bot->id)->exists();
    }

    /**
     * Abort with a 404 unless the bot is a member of the channel in its own team.
     */
    public static function assert(User $bot, Channel $channel): void
    {
        abort_unless(self::allows($bot, $channel), 404);
    }
}
