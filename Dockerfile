# syntax=docker/dockerfile:1

# =============================================================================
# Production image for self-hosting (build-from-source at a release tag).
#
#   git checkout vX.Y.Z
#   docker compose -f docker-compose.prod.yml up -d --build
#
# Development still uses Laravel Sail (compose.yaml); this image is a separate
# production path and does not replace it. Served with FrankenPHP (Caddy + a
# built-in PHP SAPI) in classic mode: one process per container, no nginx +
# PHP-FPM + supervisor juggling, and no extra Composer dependency (unlike
# Laravel Octane).
# =============================================================================

ARG PHP_VERSION=8.5

# -----------------------------------------------------------------------------
# Stage 1 — Composer: production PHP dependencies only, optimized autoloader.
# -----------------------------------------------------------------------------
FROM dunglas/frankenphp:1-php${PHP_VERSION}-alpine AS vendor

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Cache the dependency layer on the manifest alone.
COPY composer.json composer.lock ./

# --no-scripts: the post-autoload-dump `artisan package:discover` boots the full
# app, which is deferred to the runtime entrypoint (config:cache) instead.
RUN composer install \
        --no-dev \
        --no-scripts \
        --no-autoloader \
        --prefer-dist \
        --no-interaction \
        --no-progress

# Add the source and build an authoritative, optimized autoloader.
COPY . .
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative

# -----------------------------------------------------------------------------
# Stage 2 — Assets: compile the Vite/Inertia frontend (`npm ci && npm run build`).
#
# Built on the PHP base rather than a plain Node image because the Wayfinder
# Vite plugin shells out to `php artisan wayfinder:generate` during the build,
# so PHP + the vendor directory must be available here.
# -----------------------------------------------------------------------------
FROM dunglas/frankenphp:1-php${PHP_VERSION}-alpine AS assets

RUN apk add --no-cache nodejs npm

WORKDIR /app

# Cache the npm layer on the lockfile alone.
COPY package.json package-lock.json ./
RUN npm ci

# Vendor (for Wayfinder codegen) + full source.
COPY --from=vendor /app/vendor ./vendor
COPY . .

# VITE_* values are compiled into the browser bundle at build time, so the
# operator's real Reverb/app settings must be passed as build args. These are
# wired up from the .env file in docker-compose.prod.yml.
ARG VITE_APP_NAME=Laravel
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST=localhost
ARG VITE_REVERB_PORT=8080
ARG VITE_REVERB_SCHEME=https
ENV VITE_APP_NAME=${VITE_APP_NAME} \
    VITE_REVERB_APP_KEY=${VITE_REVERB_APP_KEY} \
    VITE_REVERB_HOST=${VITE_REVERB_HOST} \
    VITE_REVERB_PORT=${VITE_REVERB_PORT} \
    VITE_REVERB_SCHEME=${VITE_REVERB_SCHEME}

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3 — Runtime: slim FrankenPHP image with only what production needs.
# -----------------------------------------------------------------------------
FROM dunglas/frankenphp:1-php${PHP_VERSION}-alpine AS runtime

# pdo_pgsql: Postgres. pcntl/posix: queue worker + Reverb signal handling.
# intl/zip/opcache: framework recommendations + performance.
RUN install-php-extensions \
        pdo_pgsql \
        pcntl \
        posix \
        intl \
        zip \
        opcache \
    && apk add --no-cache curl

# Production PHP/OPcache tuning.
COPY docker/php/production.ini $PHP_INI_DIR/conf.d/zz-production.ini

WORKDIR /app

# App source, production vendor, compiled assets.
COPY . .
COPY --from=vendor /app/vendor ./vendor
COPY --from=assets /app/public/build ./public/build

# Non-root runtime user. FrankenPHP listens on 8080 (>1024), so no extra
# capabilities are required to bind the port.
RUN set -eux; \
    addgroup -g 1000 -S www; \
    adduser -u 1000 -S -G www www; \
    mkdir -p \
        storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        storage/app/public \
        bootstrap/cache; \
    chown -R www:www storage bootstrap/cache public /data /config; \
    chmod +x docker/entrypoint.sh

ENV SERVER_NAME=:8080 \
    SERVER_ROOT=/app/public

USER www

EXPOSE 8080

ENTRYPOINT ["docker/entrypoint.sh"]
CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]
