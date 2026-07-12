"""
test_images.py - Pollinations AI image generation tester
=========================================================
Tests 4 concept-art prompts against image.pollinations.ai/prompt exactly
the way the StoryForge app calls it.

Run:
    python test_images.py

Results are saved to ./test_output/ with a timing summary printed to stdout.
"""

import urllib.request
import urllib.parse
import os
import time
import random
import concurrent.futures
import threading

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "test_output")
POLLINATIONS_BASE = "https://image.pollinations.ai/prompt"
STYLE_SUFFIX = " -- cinematic concept art, highly detailed, dramatic lighting, professional illustration"

PROMPTS = [
    "A sprawling medieval city at dawn with fog rolling through cobblestone streets",
    "A lone warrior standing on a cliff edge overlooking a burning battlefield",
    "An ancient underground library filled with glowing magical tomes and artifacts",
    "A dragon perched on a mountain peak during a lightning storm at twilight",
]


def build_url(prompt):
    styled = prompt + STYLE_SUFFIX
    encoded = urllib.parse.quote(styled, safe="")
    seed = random.randint(0, 9_999_999)
    return f"{POLLINATIONS_BASE}/{encoded}?width=768&height=768&model=flux&nologo=true&seed={seed}"


def fetch_image(index, prompt):
    url = build_url(prompt)
    label = f"Image {index + 1}"
    print(f"  [{label}] Starting...")
    print(f"  [{label}] URL: {url[:110]}...")

    start = time.time()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "StoryForge-Test/1.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            status = resp.status
            content_type = resp.headers.get("Content-Type", "unknown")
            data = resp.read()
            elapsed = time.time() - start

            if status == 200 and data:
                os.makedirs(OUTPUT_DIR, exist_ok=True)
                ext = "jpg" if "jpeg" in content_type else "png" if "png" in content_type else "bin"
                filename = os.path.join(OUTPUT_DIR, f"image_{index + 1}.{ext}")
                with open(filename, "wb") as f:
                    f.write(data)
                size_kb = len(data) / 1024
                print(f"  [{label}] OK  {elapsed:.1f}s  {size_kb:.0f} KB  -> {filename}")
                return {"index": index, "status": "ok", "elapsed": elapsed, "size_kb": size_kb, "file": filename}
            else:
                print(f"  [{label}] FAIL  HTTP {status}  {elapsed:.1f}s")
                return {"index": index, "status": f"http_{status}", "elapsed": elapsed}

    except urllib.error.HTTPError as e:
        elapsed = time.time() - start
        print(f"  [{label}] FAIL  HTTPError {e.code}  {elapsed:.1f}s  - {e.reason}")
        return {"index": index, "status": f"http_{e.code}", "elapsed": elapsed, "error": str(e)}
    except Exception as e:
        elapsed = time.time() - start
        print(f"  [{label}] ERROR  {elapsed:.1f}s  - {e}")
        return {"index": index, "status": "error", "elapsed": elapsed, "error": str(e)}


def run_sequential():
    print("\n" + "=" * 60)
    print("MODE: SEQUENTIAL (one after another)")
    print("=" * 60)
    results = []
    total_start = time.time()
    for i, prompt in enumerate(PROMPTS):
        result = fetch_image(i, prompt)
        results.append(result)
    total = time.time() - total_start
    return results, total


def run_parallel():
    print("\n" + "=" * 60)
    print("MODE: PARALLEL (all 4 at once)")
    print("=" * 60)
    results = [None] * len(PROMPTS)
    lock = threading.Lock()
    total_start = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(fetch_image, i, p): i for i, p in enumerate(PROMPTS)}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            with lock:
                results[result["index"]] = result
    total = time.time() - total_start
    return results, total


def print_summary(label, results, total):
    print(f"\n--- {label} Summary ---")
    ok   = [r for r in results if r and r["status"] == "ok"]
    fail = [r for r in results if r and r["status"] != "ok"]
    print(f"  Succeeded : {len(ok)}/4")
    print(f"  Failed    : {len(fail)}/4")
    for r in results:
        if r:
            tag   = "OK  " if r["status"] == "ok" else "FAIL"
            extra = f"  {r['size_kb']:.0f} KB" if r.get("size_kb") else f"  ({r.get('error', '')[:60]})"
            print(f"  {tag}  Image {r['index'] + 1}  {r['elapsed']:.1f}s{extra}")
    print(f"  Total wall-clock: {total:.1f}s")
    if fail:
        print(f"  Failed statuses: {[r['status'] for r in fail]}")


if __name__ == "__main__":
    random.seed()
    print(f"Output dir: {OUTPUT_DIR}")

    seq_results, seq_total = run_sequential()
    print_summary("Sequential", seq_results, seq_total)

    par_results, par_total = run_parallel()
    print_summary("Parallel", par_results, par_total)

    print("\n" + "=" * 60)
    speedup = seq_total / par_total if par_total > 0 else 0
    print(f"Sequential : {seq_total:.1f}s")
    print(f"Parallel   : {par_total:.1f}s")
    print(f"Speedup    : {speedup:.1f}x")
    print("=" * 60)
