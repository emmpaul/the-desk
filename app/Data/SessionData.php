<?php

namespace App\Data;

use App\Support\UserAgentParser;
use Illuminate\Support\Carbon;
use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class SessionData extends Data
{
    public function __construct(
        public string $id,
        public ?string $ipAddress,
        public string $browser,
        public string $platform,
        public string $lastActive,
        public bool $isCurrentDevice,
    ) {}

    /**
     * Build the DTO from a raw `sessions` table row.
     */
    public static function fromSession(\stdClass $session, string $currentSessionId): self
    {
        $agent = UserAgentParser::parse($session->user_agent);

        return new self(
            id: $session->id,
            ipAddress: $session->ip_address,
            browser: $agent['browser'],
            platform: $agent['platform'],
            lastActive: Carbon::createFromTimestamp((int) $session->last_activity)->toIso8601String(),
            isCurrentDevice: $session->id === $currentSessionId,
        );
    }
}
