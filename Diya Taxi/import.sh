#!/usr/bin/env bash
# Imports the DivaTaxi collections into database "divataxi" (existing collections are dropped first).
# Needs MongoDB Database Tools (mongoimport) and mongosh.
# Usage:  ./import.sh [mongodb://host:port]      (default: mongodb://localhost:27017)
set -euo pipefail
URI="${1:-mongodb://localhost:27017}"
cd "$(dirname "$0")"

for c in customers providers orders deliveries; do
  mongoimport --uri "$URI" --db divataxi --collection "$c" --drop --jsonArray --file "data/$c.json"
done

mongosh "$URI" indexes.js
