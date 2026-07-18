<?php

namespace App\Http\Requests\Api\V1;

use App\Enums\ChannelVisibility;
use App\Models\Channel;
use App\Models\Team;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Validates a bot creating a channel in its own team via the public API.
 */
class StoreChannelRequest extends ApiRequest
{
    /**
     * A bot may only create channels in the team it is scoped to.
     */
    public function authorize(): bool
    {
        return $this->bot()->owner_team_id !== null;
    }

    /**
     * Normalize the channel name before validation (strip a leading # and trim).
     */
    #[\Override]
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => ltrim(trim((string) $this->input('name')), '#'),
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'visibility' => ['required', Rule::enum(ChannelVisibility::class)],
            'topic' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Reject a name that collides with an existing channel in the team.
     *
     * @return array<int, Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('name')) {
                    return;
                }

                $exists = Channel::query()
                    ->where('team_id', $this->team()->id)
                    ->where('slug', Str::slug((string) $this->input('name')))
                    ->exists();

                if ($exists) {
                    $validator->errors()->add('name', __('A channel with this name already exists.'));
                }
            },
        ];
    }

    /**
     * The team the channel is created in — the bot's own team.
     */
    public function team(): Team
    {
        return $this->bot()->ownerTeam()->firstOrFail();
    }
}
