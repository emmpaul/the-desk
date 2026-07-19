<?php

declare(strict_types=1);

use Illuminate\Support\Facades\DB;

/**
 * Parallel testing (paratest) points each worker at its own database via a
 * config-only switch (TestDatabases::switchToDatabase), so the DB_DATABASE env
 * var still names the base database. This test stands in for a worker by
 * moving the connection config to a probe database the same way, then asserts
 * reloadWithEnv() keeps the connection there across the application reload —
 * without the carry-over, the rebooted app rebuilds config from env and
 * silently escapes worker isolation (hitting the never-migrated base database
 * in CI).
 */
const PROBE_DATABASE = 'testing_reload_probe';

/**
 * Run a statement against the server-level `postgres` database on a dedicated
 * connection, so CREATE/DROP DATABASE never runs inside the test transaction.
 */
function runOnAdminConnection(string $sql): void
{
    config(['database.connections.reload_probe_admin' => array_merge(
        config('database.connections.'.config('database.default')),
        ['database' => 'postgres'],
    )]);

    DB::connection('reload_probe_admin')->statement($sql);
    DB::purge('reload_probe_admin');
}

test('reloadWithEnv keeps the connection on the active database across the app reload', function (): void {
    $connection = config('database.default');
    $baseDatabase = config("database.connections.{$connection}.database");

    runOnAdminConnection('DROP DATABASE IF EXISTS '.PROBE_DATABASE);
    runOnAdminConnection('CREATE DATABASE '.PROBE_DATABASE);

    config(["database.connections.{$connection}.database" => PROBE_DATABASE]);

    $this->reloadWithEnv(['REGISTRATION_ENABLED' => true]);

    $reloadedDatabase = config("database.connections.{$connection}.database");
    $connectedDatabase = DB::connection()->getDatabaseName();

    // Point the connection back at the base database (rolling back the
    // transaction reloadWithEnv opened on the probe) BEFORE asserting, so the
    // probe can be dropped and teardown never touches it — even when the
    // assertions below fail.
    DB::connection()->rollBack();
    DB::purge($connection);
    config(["database.connections.{$connection}.database" => $baseDatabase]);
    $this->beginDatabaseTransaction();

    runOnAdminConnection('DROP DATABASE IF EXISTS '.PROBE_DATABASE);

    expect($reloadedDatabase)->toBe(PROBE_DATABASE)
        ->and($connectedDatabase)->toBe(PROBE_DATABASE);
});
