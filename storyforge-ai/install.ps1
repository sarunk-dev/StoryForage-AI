# ============================================================
#  StoryForge AI - Install All Dependencies (Windows / PowerShell)
# ============================================================
#  Usage:
#    .\install.ps1
#
#  What this script does:
#    1. Checks that Node.js >= 18 and npm are available
#    2. Checks that Python >= 3.8 is available (for test_images.py)
#    3. Installs all npm dependencies (npm ci when lock-file exists)
#    4. Creates .env.local from .env.local.example (if not already present)
#    5. Prints next steps
# ============================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Write-OK([string]$msg) {
    Write-Host "  [OK]   $msg" -ForegroundColor Green
}

function Write-Warn([string]$msg) {
    Write-Host "  [WARN] $msg" -ForegroundColor Yellow
}

function Write-Fail([string]$msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
}

# ---------- 0. Banner ----------------------------------------
Write-Host ""
Write-Host "  StoryForge AI - Dependency Installer" -ForegroundColor Magenta
Write-Host ""

# ---------- 1. Check Node.js ---------------------------------
Write-Step "Checking Node.js..."
try {
    $nodeVersion = node --version 2>&1
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -lt 18) {
        Write-Fail "Node.js $nodeVersion found, but >= 18 is required."
        Write-Host "  Download: https://nodejs.org/en/download" -ForegroundColor DarkGray
        exit 1
    }
    Write-OK "Node.js $nodeVersion"
} catch {
    Write-Fail "Node.js not found. Install from https://nodejs.org/en/download"
    exit 1
}

# ---------- 2. Check npm -------------------------------------
Write-Step "Checking npm..."
try {
    $npmVersion = npm --version 2>&1
    Write-OK "npm $npmVersion"
} catch {
    Write-Fail "npm not found. It should ship with Node.js."
    exit 1
}

# ---------- 3. Check Python (optional) -----------------------
Write-Step "Checking Python (optional - used by test_images.py)..."
$pythonCmd = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $ver = & $cmd --version 2>&1
        if ($ver -match "Python (\d+)\.(\d+)") {
            $major = [int]$Matches[1]
            $minor = [int]$Matches[2]
            if ($major -ge 3 -and $minor -ge 8) {
                $pythonCmd = $cmd
                Write-OK "$ver (via $cmd)"
                break
            }
        }
    } catch { }
}
if (-not $pythonCmd) {
    Write-Warn "Python >= 3.8 not found. test_images.py will not run, but the app itself is unaffected."
    Write-Warn "Download Python: https://www.python.org/downloads/"
}

# ---------- 4. Install npm dependencies ----------------------
Write-Step "Installing npm dependencies..."
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$packageJson = Join-Path $scriptDir "package.json"
$lockFile = Join-Path $scriptDir "package-lock.json"

if (-not (Test-Path $packageJson)) {
    Write-Fail "package.json not found at: $packageJson"
    exit 1
}

Push-Location $scriptDir
try {
    if (Test-Path $lockFile) {
        Write-Host "  Lock file found - running npm ci for a clean install..." -ForegroundColor DarkGray
        npm ci
    } else {
        Write-Host "  No lock file found - running npm install..." -ForegroundColor DarkGray
        npm install
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "npm install failed (exit code $LASTEXITCODE)."
        exit $LASTEXITCODE
    }
    Write-OK "npm packages installed."
} finally {
    Pop-Location
}

# ---------- 5. Environment file ------------------------------
Write-Step "Checking .env.local..."
$envLocal = Join-Path $scriptDir ".env.local"
$envExample = Join-Path $scriptDir ".env.local.example"

if (Test-Path $envLocal) {
    Write-OK ".env.local already exists - leaving it untouched."
} elseif (Test-Path $envExample) {
    Copy-Item $envExample $envLocal
    Write-OK ".env.local created from .env.local.example."
    Write-Warn "Open .env.local and fill in your API keys before starting the app."
} else {
    Write-Warn ".env.local not found. Create storyforge-ai/.env.local with the keys below:"
    Write-Host ""
    Write-Host "    WATSONX_API_KEY=<your IBM watsonx.ai API key>" -ForegroundColor DarkGray
    Write-Host "    WATSONX_PROJECT_ID=<your IBM watsonx.ai project ID>" -ForegroundColor DarkGray
    Write-Host "    ELEVENLABS_API_KEY=<your ElevenLabs API key>" -ForegroundColor DarkGray
    Write-Host "    # WATSONX_SERVICE_URL=https://us-south.ml.cloud.ibm.com  (optional)" -ForegroundColor DarkGray
    Write-Host "    # REPLICATE_API_TOKEN=<only if using Replicate image gen>" -ForegroundColor DarkGray
    Write-Host ""
}

# ---------- 6. Done ------------------------------------------
Write-Host ""
Write-Host "---------------------------------------------" -ForegroundColor DarkGray
Write-Host "  All dependencies installed successfully!" -ForegroundColor Green
Write-Host "---------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "    1. Ensure .env.local has your API keys" -ForegroundColor DarkGray
Write-Host "    2. Start the dev server:" -ForegroundColor DarkGray
Write-Host "         cd storyforge-ai" -ForegroundColor Yellow
Write-Host "         npm run dev" -ForegroundColor Yellow
Write-Host "    3. Open http://localhost:3000 in your browser" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Optional - test image generation:" -ForegroundColor White
Write-Host "         python test_images.py" -ForegroundColor Yellow
Write-Host ""
