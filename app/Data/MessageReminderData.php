<?php

namespace App\Data;

use App\Models\MessageReminder;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class MessageReminderData extends Data
{
    public function __construct(
        public string $id,
        public string $messageId,
        public string $remindAt,
        public string $teamSlug,
        public string $channelSlug,
        public ?string $channelName,
        public string $authorName,
        public string $body,
        public bool $isDeleted,
        public bool $isAccessible,
    ) {}

    /**
     * Build the DTO from a MessageReminder model.
     *
     * `remind_at` is serialized as a UTC ISO 8601 instant; the client renders it
     * in the viewer's timezone. The `message` relation (with its `user` and
     * `channel.team`) should be eager-loaded so the nudge and list render the
     * quote and a working link back to the message. A since-deleted message
     * blanks its body, leaving only the `isDeleted` flag for a "message deleted"
     * stub — its channel and author still resolve so the link stays valid.
     *
     * `$isAccessible` carries the caller's `view` check on the channel, which
     * has to be re-evaluated on every read because a viewer can lose access long
     * after the reminder was set. When it is false the row survives — clearing it
     * stays the owner's call, and regaining access restores it intact — but
     * everything the viewer may no longer see is blanked: the body, the author,
     * the channel name, and the channel slug the jump link is built from.
     */
    public static function fromMessageReminder(MessageReminder $reminder, bool $isAccessible = true): self
    {
        $message = $reminder->message;
        $channel = $message->channel;
        $isDeleted = $message->trashed();

        return new self(
            id: $reminder->id,
            messageId: $message->id,
            remindAt: $reminder->remind_at->toIso8601String(),
            teamSlug: $channel->team->slug,
            channelSlug: $isAccessible ? $channel->slug : '',
            channelName: $isAccessible ? $channel->name : null,
            authorName: $isAccessible ? $message->user->name : '',
            body: $isDeleted || ! $isAccessible ? '' : $message->body,
            isDeleted: $isDeleted,
            isAccessible: $isAccessible,
        );
    }
}
