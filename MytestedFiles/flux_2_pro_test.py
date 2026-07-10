import os
import replicate
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set Replicate API token
os.environ["REPLICATE_API_TOKEN"] = os.getenv("REPLICATE_API_TOKEN")

# Generate image
output = replicate.run(
    "black-forest-labs/flux-2-pro",
    input={
        "prompt": """
A majestic white tiger sitting on a snowy mountain at sunrise,
cinematic lighting,
ultra realistic,
8K,
highly detailed,
National Geographic photography,
masterpiece.
""",
        "resolution": "1 MP",
        "aspect_ratio": "1:1",
        "input_images": [],
        "output_format": "png",
        "output_quality": 100,
        "safety_tolerance": 2,
    },
)

# Print URL
print(f"\nImage URL:\n{output.url}\n")

# Save image
filename = "flux2_output.png"

with open(filename, "wb") as f:
    f.write(output.read())

print(f"✅ Image saved as {filename}")