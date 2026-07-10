#!/bin/sh
#
# Bootstrap a production .env for the Docker self-hosting stack.
#
#   ./docker/gen-secrets.sh
#
# Creates .env from .env.prod.example (if missing) and fills any EMPTY required
# secret with a freshly generated value. Existing values are never overwritten,
# so the script is safe to re-run. After it finishes, fill in the non-secret
# settings (APP_URL, mail, VITE_REVERB_HOST, …) before building the stack.
set -eu

EXAMPLE_FILE=".env.prod.example"
ENV_FILE=".env"

if ! command -v openssl >/dev/null 2>&1; then
    echo "Error: openssl is required to generate secrets." >&2
    exit 1
fi

if [ ! -f "$EXAMPLE_FILE" ]; then
    echo "Error: $EXAMPLE_FILE not found. Run this from the project root." >&2
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    cp "$EXAMPLE_FILE" "$ENV_FILE"
    echo "Created $ENV_FILE from $EXAMPLE_FILE."
fi

# Set KEY=VALUE only when KEY is currently empty (matches "KEY=" at end of line).
set_if_empty() {
    key="$1"
    value="$2"
    if grep -Eq "^${key}=$" "$ENV_FILE"; then
        # Use a non-/ delimiter since values may contain / or +.
        tmp="$(mktemp)"
        sed "s#^${key}=\$#${key}=${value}#" "$ENV_FILE" >"$tmp"
        mv "$tmp" "$ENV_FILE"
        echo "  set ${key}"
    else
        echo "  kept ${key} (already set)"
    fi
}

echo "Generating missing secrets in $ENV_FILE:"
set_if_empty "APP_KEY"         "base64:$(openssl rand -base64 32)"
set_if_empty "DB_PASSWORD"     "$(openssl rand -hex 24)"
set_if_empty "MEILISEARCH_KEY" "$(openssl rand -hex 32)"
set_if_empty "REVERB_APP_ID"   "$(openssl rand 4 | od -An -tu4 | tr -d ' ')"

# The browser (VITE_REVERB_APP_KEY) and server (REVERB_APP_KEY) must share the
# same app key, so generate it once and set both when they are empty.
reverb_key="$(openssl rand -hex 16)"
set_if_empty "REVERB_APP_KEY"      "$reverb_key"
set_if_empty "VITE_REVERB_APP_KEY" "$reverb_key"
set_if_empty "REVERB_APP_SECRET"   "$(openssl rand -hex 16)"

echo
echo "Done. Review $ENV_FILE and set APP_URL, mail credentials, and the"
echo "browser-side VITE_REVERB_* values before running:"
echo "  docker compose -f docker-compose.prod.yml up -d --build"
