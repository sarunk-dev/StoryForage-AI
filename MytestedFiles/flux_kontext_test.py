import os
import base64
import mimetypes
import replicate
from dotenv import load_dotenv

load_dotenv()

os.environ["REPLICATE_API_TOKEN"] = os.getenv("REPLICATE_API_TOKEN")


def image_to_data_url(image_path):
    mime_type = mimetypes.guess_type(image_path)[0] or "image/png"

    with open(image_path, "rb") as image_file:
        encoded = base64.b64encode(image_file.read()).decode("utf-8")

    return f"data:{mime_type};base64,{encoded}"


reference_image = "flux2_output.png"

image_data = image_to_data_url(reference_image)

output = replicate.run(
    "black-forest-labs/flux-kontext-pro",
    input={
        "input_image": image_data,
        "prompt": """
Keep the exact same majestic white tiger.

Preserve:
- the tiger's face
- the tiger's fur pattern
- the realistic photography style
- the overall composition

Only make these changes:
- it is now nighttime
- beautiful green and purple aurora fills the sky
- light snowfall
- glowing blue ice crystals around the tiger
- cinematic moonlight
- ultra realistic
- National Geographic photography
""",
        "aspect_ratio": "match_input_image",
        "output_format": "png",
        "prompt_upsampling": False,
        "safety_tolerance": 2,
    },
)

print("Image URL:")
print(output.url)

with open("flux_kontext_result.png", "wb") as f:
    f.write(output.read())

print("✅ Saved as flux_kontext_result.png")