<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Integrations platform toggle
    |--------------------------------------------------------------------------
    |
    | Master switch for the integrations platform (bot users, the public REST
    | API, and webhooks). When disabled the /api/v1 surface 404s and the
    | management UI hides, so an operator who wants none of it can turn the whole
    | feature off. Defaults to on.
    |
    */

    'enabled' => (bool) env('INTEGRATIONS_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Public API per-token rate limit
    |--------------------------------------------------------------------------
    |
    | The maximum number of requests a single bot token may make to /api/v1 per
    | minute. Exceeding it yields a 429 with a Retry-After header. Raise it for
    | busy integrations, or lower it to protect a small instance.
    |
    */

    'api_rate_limit' => (int) env('INTEGRATIONS_API_RATE_LIMIT', 60),

];
