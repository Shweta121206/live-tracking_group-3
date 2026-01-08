#!/bin/bash

# #region agent log
LOG_FILE="${PWD}/.cursor/debug.log"
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
log_debug() {
  echo "{\"id\":\"log_$(date +%s)_$$\",\"timestamp\":$(date +%s)000,\"location\":\"start.sh:$1\",\"message\":\"$2\",\"data\":$3,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"$4\"}" >> "$LOG_FILE" 2>/dev/null || true
}
# #endregion

# Log environment variables (without sensitive data)
log_debug "10" "Start script entry" "{\"PORT\":\"${PORT:-NOT_SET}\",\"DATABASE_URL\":\"${DATABASE_URL:+SET}\",\"DJANGO_SECRET_KEY\":\"${DJANGO_SECRET_KEY:+SET}\",\"ALLOWED_HOSTS\":\"${ALLOWED_HOSTS:-NOT_SET}\"}" "A,B,C,D"

# Check if PORT is set
if [ -z "$PORT" ]; then
  log_debug "15" "PORT not set, using default 8000" "{}" "B"
  PORT=8000
fi

# Check if gunicorn is available
if ! command -v gunicorn &> /dev/null; then
  log_debug "20" "Gunicorn not found in PATH" "{}" "A"
  echo "ERROR: gunicorn not found" >&2
  exit 1
fi
log_debug "22" "Gunicorn found" "{\"gunicorn_path\":\"$(which gunicorn)\"}" "A"

# Collect static files (moved from Dockerfile to runtime)
echo "Collecting static files..."
log_debug "28" "Before collectstatic" "{}" "F"
python manage.py collectstatic --noinput 2>&1 | tee -a "$LOG_FILE" 2>/dev/null || {
  COLLECT_EXIT=$?
  log_debug "30" "Collectstatic failed (non-fatal)" "{\"exit_code\":$COLLECT_EXIT}" "F"
  echo "WARNING: collectstatic failed, continuing anyway..." >&2
}
log_debug "34" "Collectstatic completed" "{}" "F"

# Run database migrations
echo "Running database migrations..."
log_debug "37" "Before migrations" "{}" "E"
if ! python manage.py migrate 2>&1; then
  MIGRATE_EXIT=$?
  log_debug "40" "Migration failed" "{\"exit_code\":$MIGRATE_EXIT}" "E"
  echo "ERROR: Database migrations failed with exit code $MIGRATE_EXIT" >&2
  exit 1
fi
log_debug "44" "Migrations completed" "{}" "E"

# Test database connection
log_debug "48" "Testing database connection" "{}" "C"
python -c "
import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'maritime_project.settings')
try:
    django.setup()
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute('SELECT 1')
    print('Database connection successful')
    sys.exit(0)
except Exception as e:
    import traceback
    print(f'Database connection failed: {e}', file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
" 2>&1 || {
  DB_EXIT=$?
  log_debug "62" "Database connection test failed" "{\"exit_code\":$DB_EXIT}" "C"
  echo "ERROR: Database connection test failed with exit code $DB_EXIT" >&2
  echo "Please check your DATABASE_URL environment variable" >&2
  exit 1
}
log_debug "67" "Database connection test passed" "{}" "C"

# Start the application
echo "Starting Gunicorn server..."
log_debug "58" "Starting Gunicorn" "{\"port\":\"$PORT\",\"bind\":\"0.0.0.0:$PORT\"}" "B"
exec gunicorn maritime_project.wsgi:application --bind 0.0.0.0:$PORT --workers 4 --timeout 120