import os
from PIL import Image

def optimize_image(input_path, output_path, max_width=None):
    try:
        if not os.path.exists(input_path):
            print(f"File not found: {input_path}")
            return

        with Image.open(input_path) as img:
            # Resize if needed
            if max_width and img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                print(f"Resized {input_path} to {max_width}px width.")

            # Save as WebP
            img.save(output_path, 'WEBP', quality=80)
            print(f"Saved optimized image to {output_path}")
            
            # Optional: Remove original if successful? No, let's keep it for safety.
    except Exception as e:
        print(f"Error optimizing {input_path}: {e}")

def main():
    base_dir = r"c:\Users\ALBARQSOFT\AndroidStudioProjects\travelSystem\image"
    
    # Logo
    optimize_image(os.path.join(base_dir, "logo.PNG"), os.path.join(base_dir, "logo.webp"), max_width=500)
    
    # Forget Password Image
    optimize_image(os.path.join(base_dir, "forget.png"), os.path.join(base_dir, "forget.webp"), max_width=800)
    
    # Sleeping 404 (GIFs are tricky, let's just copy it or skip for now if we want static webp, but let's try to save first frame as static webp or just skip)
    # optimize_image(os.path.join(base_dir, "Sleeping 404.gif"), os.path.join(base_dir, "Sleeping 404.webp"))

if __name__ == "__main__":
    main()
