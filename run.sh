#!/usr/bin/env bash
# StreetConnect - Run backend + frontend (with or without Docker)

set -e
cd "$(dirname "$0")"

case "${1:-}" in
  docker|--docker|-d)
    echo "Starting Docker Postgres (port 5433)..."
    docker-compose up -d postgres
    echo ""
    echo "✅ Postgres is running on port 5433."
    echo "Start backend: cd backend && npm run dev"
    echo "Start frontend: cd frontend && npm run start:clear"
    ;;
  *)
    echo "Starting backend and frontend (requires PostgreSQL and Redis running)..."
    echo "Tip: Run './run.sh docker' to start DB + Redis + backend with Docker."
    echo ""
    if command -v concurrently >/dev/null 2>&1; then
      npm run dev
    else
      echo "Installing concurrently..."
      npm install
      npm run dev
    fi
    ;;
esac
