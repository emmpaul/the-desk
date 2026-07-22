<?php

use App\Data\UserData;
use App\Events\UserProfileUpdated;
use App\Models\User;

test('the serialized author payload carries the dnd flag', function (): void {
    $paused = User::factory()->create(['dnd_until' => now()->addHour()]);
    $free = User::factory()->create();

    expect(UserData::fromUser($paused)->isDnd)->toBeTrue()
        ->and(UserData::fromUser($free)->isDnd)->toBeFalse();
});

test('the author payload never leaks the pause instant or the schedule', function (): void {
    $user = User::factory()->create([
        'dnd_until' => now()->addHour(),
        'dnd_schedule_enabled' => true,
        'dnd_starts_at' => '22:00',
        'dnd_ends_at' => '07:00',
    ]);

    $payload = UserData::fromUser($user)->toArray();

    expect(array_keys($payload))->not->toContain('dndUntil', 'dndScheduleEnabled', 'dndStartsAt', 'dndEndsAt')
        ->and(json_encode($payload))->not->toContain('22:00', '07:00');
});

test('a user reads their own full dnd configuration, raw columns hidden', function (): void {
    $until = now()->addHour()->startOfSecond();

    $user = User::factory()->create([
        'dnd_until' => $until,
        'dnd_schedule_enabled' => true,
        'dnd_starts_at' => '22:00',
        'dnd_ends_at' => '07:00',
    ]);

    $serialized = $user->toArray();

    expect($serialized['dnd']['until'])->toBe($until->toIso8601String())
        ->and($serialized['dnd']['scheduleEnabled'])->toBeTrue()
        ->and($serialized['dnd']['startsAt'])->toBe('22:00')
        ->and($serialized['dnd']['endsAt'])->toBe('07:00')
        ->and($serialized)->not->toHaveKeys(['dnd_until', 'dnd_schedule_enabled', 'dnd_starts_at', 'dnd_ends_at']);
});

test('a lapsed pause reads as absent from the own dnd configuration', function (): void {
    $user = User::factory()->create(['dnd_until' => now()->subMinute()]);

    expect($user->toArray()['dnd']['until'])->toBeNull();
});

test('the profile broadcast carries the dnd flag to teammates', function (): void {
    $user = User::factory()->create(['dnd_until' => now()->addHour()]);

    $payload = (new UserProfileUpdated($user))->broadcastWith();

    expect($payload['user']['isDnd'])->toBeTrue();
});
