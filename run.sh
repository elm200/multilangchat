#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

if [ ! -d node_modules ]; then
  echo "node_modules not found, running npm install..."
  npm install --quiet
fi
# public/ はビルド成果物でgit管理外のため、起動のたびに最新ソースからビルドし直す。
npm run build --silent

if [ ! -d venv ]; then
  echo "venv not found, creating it..."
  python3 -m venv venv
  venv/bin/pip install --quiet --upgrade pip
  venv/bin/pip install --quiet -r requirements.txt
fi

exec venv/bin/python main.py
