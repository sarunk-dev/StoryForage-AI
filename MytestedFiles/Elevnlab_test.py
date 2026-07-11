import os
import requests
import boto3
from dotenv import load_dotenv

load_dotenv()

# ============================
# Environment Variables
# ============================
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET = os.getenv("S3_BUCKET")
S3_PUBLIC_URL = os.getenv("S3_PUBLIC_URL")

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
FREESOUND_API_KEY = os.getenv("FREESOUND_API_KEY")

# ============================
# AWS Client
# ============================
s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
)


def upload_to_s3(local_file, s3_name):
    s3.upload_file(local_file, S3_BUCKET, s3_name)
    print(f"✅ Uploaded: {s3_name}")
    return f"{S3_PUBLIC_URL}/{s3_name}"


# ============================
# STEP 1
# Search Freesound
# ============================

print("\nSearching Freesound...")

response = requests.get(
    "https://freesound.org/apiv2/search/text/",
    params={
        "query": "wind",
        "page_size": 1,
        "token": FREESOUND_API_KEY,
    },
)

data = response.json()

sound = data["results"][0]

print("Found:", sound["name"])

sound_id = sound["id"]

# ============================
# STEP 2
# Get Preview URL
# ============================

details = requests.get(
    f"https://freesound.org/apiv2/sounds/{sound_id}/",
    params={"token": FREESOUND_API_KEY},
).json()

preview_url = details["previews"]["preview-hq-mp3"]

print("Downloading preview...")

audio = requests.get(preview_url)

with open("freesound_preview.mp3", "wb") as f:
    f.write(audio.content)

print("✅ Downloaded Freesound preview")

# ============================
# STEP 3
# Upload Preview to S3
# ============================

preview_url_s3 = upload_to_s3(
    "freesound_preview.mp3",
    "freesound_preview.mp3",
)

# ============================
# STEP 4
# Generate ElevenLabs Speech
# ============================

print("\nGenerating ElevenLabs speech...")

voices = requests.get(
    "https://api.elevenlabs.io/v1/voices",
    headers={"xi-api-key": ELEVENLABS_API_KEY},
).json()

voice_id = voices["voices"][0]["voice_id"]

tts = requests.post(
    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
    headers={
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    },
    json={
        "text": "Hello! My name is Kalpa Kalpa.",
        "model_id": "eleven_multilingual_v2",
    },
)

with open("speech.mp3", "wb") as f:
    f.write(tts.content)

print("✅ Speech generated")

# ============================
# STEP 5
# Upload Speech to S3
# ============================

speech_url_s3 = upload_to_s3(
    "speech.mp3",
    "speech.mp3",
)

# ============================
# STEP 6
# Results
# ============================

print("\n==============================")
print("SUCCESS!")
print("==============================")

print("Freesound Preview:")
print(preview_url_s3)

print()

print("ElevenLabs Speech:")
print(speech_url_s3)
