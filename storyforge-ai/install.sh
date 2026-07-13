#!/usr/bin/env bash
# ============================================================
#  StoryForge AI — Install All Dependencies (macOS / Linux)
# ============================================================
#  Usage:
#    chmod +x install.sh && ./install.sh
#
#  What this script does:
#    1. Checks that Node.js >= 18 and npm are available
#    2. Checks that Python >= 3.8 is available (for test_images.py)
#    3. Installs all npm dependencies (npm ci when lock-file exists)
#    4. Creates .env.local from .env.local.example (if not already present)
#    5. Prints next steps
# ============================================================

set -euo pipefail

# ── Colours ───────────────────────────────────────────────
CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; GRAY='\033[0;90m'; MAGENTA='\033[0;35m'; RESET='\033[0m'

step()  { echo -e "\n${CYAN}==> $*${RESET}"; }
ok()    { echo -e "  ${GREEN}[OK]${RESET}   $*"; }
warn()  { echo -e "  ${YELLOW}[WARN]${RESET} $*"; }
fail()  { echo -e "  ${RED}[FAIL]${RESET} $*"; exit 1; }

# ── 0. Banner ─────────────────────────────────────────────
echo ""
echo -e "${MAGENTA}  StoryForge AI — Dependency Installer${RESET}"
echo ""

# ── Resolve script directory ──────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── 1. Check Node.js ──────────────────────────────────────
step "Checking Node.js..."
if ! command -v node &>/dev/null; then
    fail "Node.js not found. Install it from https://nodejs.org/en/download"
fi
NODE_VERSION="$(node --version)"
NODE_MAJOR="${NODE_VERSION//[!0-9.]}" ; NODE_MAJOR="${NODE_MAJOR%%.*}"
if [ "${NODE_MAJOR}" -lt 18 ]; then
    fail "Node.js ${NODE_VERSION} found, but >= 18 is required. Download: https://nodejs.org/en/download"
fi
ok "Node.js ${NODE_VERSION}"

# ── 2. Check npm ──────────────────────────────────────────
step "Checking npm..."
if ! command -v npm &>/dev/null; then
    fail "npm not found. It should ship with Node.js."
fi
NPM_VERSION="$(npm --version)"
ok "npm ${NPM_VERSION}"

# ── 3. Check Python (optional) ────────────────────────────
step "Checking Python (optional, used by test_images.py)..."
PYTHON_CMD=""
for cmd in python3 python py; do
    if command -v "$cmd" &>/dev/null; then
        PY_VER="$($cmd --version 2>&1)"
        PY_MAJOR="$(echo "$PY_VER" | grep -oE '[0-9]+\.[0-9]+' | head -1 | cut -d. -f1)"
        PY_MINOR="$(echo "$PY_VER" | grep -oE '[0-9]+\.[0-9]+' | head -1 | cut -d. -f2)"
        if [ "${PY_MAJOR:-0}" -ge 3 ] && [ "${PY_MINOR:-0}" -ge 8 ]; then
            PYTHON_CMD="$cmd"
            ok "$PY_VER (via '$cmd')"
            break
        fi
    fi
done
if [ -z "$PYTHON_CMD" ]; then
    warn "Python >= 3.8 not found. test_images.py will not run, but the app itself is unaffected."
    warn "Download Python: https://www.python.org/downloads/"
fi

# ── 4. Install npm dependencies ───────────────────────────
step "Installing npm dependencies..."
cd "$SCRIPT_DIR"

if [ ! -f "package.json" ]; then
    fail "package.json not found in $SCRIPT_DIR"
fi

if [ -f "package-lock.json" ]; then
    echo -e "  ${GRAY}Lock file found — running 'npm ci' for a clean, reproducible install...${RESET}"
    npm ci
else
    echo -e "  ${GRAY}No lock file found — running 'npm install'...${RESET}"
    npm install
fi
ok "npm packages installed."

# ── 5. Environment file ───────────────────────────────────
step "Checking .env.local..."
ENV_LOCAL="$SCRIPT_DIR/.env.local"
ENV_EXAMPLE="$SCRIPT_DIR/.env.local.example"

if [ -f "$ENV_LOCAL" ]; then
    ok ".env.local already exists — leaving it untouched."
elif [ -f "$ENV_EXAMPLE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_LOCAL"
    ok ".env.local created from .env.local.example."
    warn "Open .env.local and fill in your API keys before starting the app."
else
    warn ".env.local not found and no .env.local.example to copy from."
    warn "Create storyforge-ai/.env.local with the following keys:"
    echo ""
    echo -e "${GRAY}    WATSONX_API_KEY=<your IBM watsonx.ai API key>"
    echo -e "    WATSONX_PROJECT_ID=<your IBM watsonx.ai project ID>"
    echo -e "    ELEVENLABS_API_KEY=<your ElevenLabs API key>"
    echo -e "    # WATSONX_SERVICE_URL=https://us-south.ml.cloud.ibm.com  (optional)"
    echo -e "    # REPLICATE_API_TOKEN=<only if using Replicate image gen>${RESET}"
    echo ""
fi

# ── 6. Done ───────────────────────────────────────────────
echo ""
echo -e "${GRAY}─────────────────────────────────────────────${RESET}"
echo -e "  ${GREEN}All dependencies installed successfully!${RESET}"
echo -e "${GRAY}─────────────────────────────────────────────${RESET}"
echo ""
echo -e "  Next steps:"
echo -e "  ${GRAY}  1. Ensure .env.local has your API keys${RESET}"
echo -e "  ${GRAY}  2. Run the dev server:${RESET}"
echo -e "       ${YELLOW}cd storyforge-ai${RESET}"
echo -e "       ${YELLOW}npm run dev${RESET}"
echo -e "  ${GRAY}  3. Open http://localhost:3000 in your browser${RESET}"
echo ""
echo -e "  Optional — test image generation:"
echo -e "       ${YELLOW}python test_images.py${RESET}"
echo ""
