<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\ChannelVisibility;
use App\Support\Integrations\BotChannelAccess;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

/**
 * Validates a bot adding a team member to one of its private channels via the
 * public API.
 */
class AddMemberRequest extends ApiRequest
{
    /**
     * A bot manages membership only on a private channel it belongs to. The human
     * `managesMembership` gate leans on team membership (which a bot lacks), so
     * the API grounds it on channel membership + private visibility instead.
     */
    public function authorize(): bool
    {
        BotChannelAccess::assert($this->bot(), $this->channel());

        return $this->channel()->visibility === ChannelVisibility::Private;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => [
                'required',
                'uuid',
                Rule::exists('team_members', 'user_id')->where('team_id', $this->channel()->team_id),
            ],
        ];
    }
}
