#!/usr/bin/env bash
# ------------------------------------------------------------------
# One-time setup: installs a local MongoDB (no root needed) and
# starts it on port 27017 for the Gurukripa Estate project.
# ------------------------------------------------------------------
set -e

MONGO_VERSION="8.0.6"
RUNTIME_DIR="$(cd "$(dirname "$0")/.." && pwd)/.runtime"
DBPATH="$RUNTIME_DIR/mongodb-data"
BINDIR="$RUNTIME_DIR/mongodb/bin"

echo "== Gurukripa Estate — MongoDB setup =="

# 1) Already running?
if (command -v mongod >/dev/null 2>&1 && pgrep -x mongod >/dev/null 2>&1) || [ -f "$DBPATH/mongod.lock" ]; then
  echo "MongoDB appears to be running already."
fi

if command -v mongod >/dev/null 2>&1; then
  echo "[ok] system mongod found: $(mongod --version | head -1)"
else
  mkdir -p "$RUNTIME_DIR"
  BIN="$BINDIR/mongod"
  if [ ! -x "$BIN" ]; then
    echo "[..] downloading MongoDB $MONGO_VERSION (no root needed)…"
    OS=$(uname -s)
    ARCH=$(uname -m)
    case "$OS-$ARCH" in
      Linux-x86_64) DIST="debian12";;
      Linux-aarch64) DIST="ubuntu2204-arm64";;
      Darwin-*) echo "On macOS? Just run: brew install mongodb-community"; exit 1;;
      *) echo "Unsupported platform $OS-$ARCH"; exit 1;;
    esac
    TARBALL="mongodb-linux-x86_64-$DIST-$MONGO_VERSION.tgz"
    if [ "$DIST" = "ubuntu2204-arm64" ]; then TARBALL="mongodb-linux-aarch64-$DIST-$MONGO_VERSION.tgz"; fi
    curl -fL -o "$RUNTIME_DIR/mongodb.tgz" \
      "https://fastdl.mongodb.org/linux/$TARBALL"
    tar -xzf "$RUNTIME_DIR/mongodb.tgz" -C "$RUNTIME_DIR"
    mv "$RUNTIME_DIR"/mongodb-* "$RUNTIME_DIR/mongodb"
    rm -f "$RUNTIME_DIR/mongodb.tgz"
    echo "[ok] downloaded to $RUNTIME_DIR/mongodb"
  fi
  BIN="$BINDIR/mongod"
fi

mkdir -p "$DBPATH"

# 2) Start it (background, survives while terminal is open)
if pgrep -x mongod >/dev/null 2>&1; then
  echo "[ok] mongod is already running"
else
  nohup "$BIN" --dbpath "$DBPATH" --port 27017 --bind_ip 127.0.0.1 \
    --logpath "$RUNTIME_DIR/mongod.log" --fork >/dev/null 2>&1 || {
      "$BIN" --dbpath "$DBPATH" --port 27017 --bind_ip 127.0.0.1 \
        --logpath "$RUNTIME_DIR/mongod.log" &
      sleep 2
    }
  echo "[ok] mongod started (log: $RUNTIME_DIR/mongod.log)"
fi

# 3) Seed
echo "[..] seeding database…"
npm --prefix server run seed
echo "== Done. Run: npm run dev  =="
