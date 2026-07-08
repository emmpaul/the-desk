<?php

namespace App\Models;

use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $channel_id
 * @property string $user_id
 * @property string $client_uuid
 * @property string $body
 * @property Carbon|null $edited_at
 * @property Carbon|null $deleted_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Channel $channel
 * @property-read User $user
 * @property-read Collection<int, User> $mentionedUsers
 */
#[Fillable(['channel_id', 'user_id', 'client_uuid', 'body', 'edited_at'])]
class Message extends Model
{
    /** @use HasFactory<MessageFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * Get the channel the message was posted to.
     *
     * @return BelongsTo<Channel, $this>
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    /**
     * Get the user who authored the message.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the team members mentioned in this message.
     *
     * Backed by the `mentions` join table; the parser keeps these rows in sync
     * with the `@[Name](user-id)` tokens in the body on every post and edit.
     *
     * @return BelongsToMany<User, $this>
     */
    public function mentionedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'mentions', 'message_id', 'mentioned_user_id')
            ->withTimestamps();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'edited_at' => 'datetime',
        ];
    }
}
