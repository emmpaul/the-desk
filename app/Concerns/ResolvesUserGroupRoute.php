<?php

namespace App\Concerns;

use App\Models\Team;
use App\Models\UserGroup;

/**
 * Resolves the `{team}` and `{group}` route bindings for the user-group
 * management requests, and enforces that the group really belongs to the team
 * in the URL. The scoping check runs before any policy so another workspace's
 * group reads as absent here rather than merely forbidden.
 */
trait ResolvesUserGroupRoute
{
    /**
     * Get the team in the URL.
     */
    public function team(): Team
    {
        $team = $this->route('team');

        abort_if(! $team instanceof Team, 404);

        return $team;
    }

    /**
     * Get the group in the URL, scoped to that team.
     */
    public function group(): UserGroup
    {
        $group = $this->route('group');

        abort_if(! $group instanceof UserGroup, 404);
        abort_unless($group->team_id === $this->team()->id, 404);

        return $group;
    }
}
