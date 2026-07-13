import requests

PROMPTS = [
    "A majestic white tiger sitting on a snowy mountain at sunrise",
    "A futuristic cyberpunk city at night with neon lights",
    "An astronaut riding a horse on Mars, cinematic",
    "A peaceful Japanese garden during autumn, ultra realistic"
]

BASE_URL = "https://image.pollinations.ai/prompt/"

for i, prompt in enumerate(PROMPTS, start=1):
    print(f"Generating image {i}...")

    url = BASE_URL + requests.utils.quote(prompt)

    try:
        # This call blocks until Pollinations finishes generating the image
        response = requests.get(url, timeout=300)

        if response.status_code == 200:
            filename = f"image_{i}.png"
            with open(filename, "wb") as f:
                f.write(response.content)
            print(f"✅ Saved {filename}")
        else:
            print(f"❌ Failed with status code {response.status_code}")

    except Exception as e:
        print(f"❌ Error: {e}")

print("All images generated.")