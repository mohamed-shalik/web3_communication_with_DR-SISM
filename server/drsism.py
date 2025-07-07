import cv2
import numpy as np
import sys
import os
import json

def encrypt_image(image_path):
    image = cv2.imread(image_path)  # Read in color
    if image is None:
        raise ValueError("Image not found or invalid file format.")
    
    rows, cols, _ = image.shape
    
    # Split the image into three channels
    b, g, r = cv2.split(image)
    
    # Generate random shares
    random_share = np.random.randint(0, 256, size=(rows, cols), dtype=np.uint8)
    
    # Encrypt each channel
    share1_b = random_share
    share2_b = cv2.bitwise_xor(b, random_share)
    
    share1_g = random_share
    share2_g = cv2.bitwise_xor(g, random_share)
    
    share1_r = random_share
    share2_r = cv2.bitwise_xor(r, random_share)
    
    # Merge the channels to create the two shares
    share1 = cv2.merge([share1_b, share1_g, share1_r])
    share2 = cv2.merge([share2_b, share2_g, share2_r])
    
    # Save shares
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    base_name = os.path.basename(image_path)
    share1_path = os.path.join(upload_dir, f"share1_{base_name}")
    share2_path = os.path.join(upload_dir, f"share2_{base_name}")
    
    cv2.imwrite(share1_path, share1)
    cv2.imwrite(share2_path, share2)
    
    return share1_path, share2_path

def decrypt_image(share1_path, share2_path):

    share1 = cv2.imread(share1_path)
    share2 = cv2.imread(share2_path)

    if share1 is None or share2 is None:
        raise ValueError("Invalid share paths provided")
    
    b1, g1, r1 = cv2.split(share1)
    b2, g2, r2 = cv2.split(share2)
    
    decrypted_b = cv2.bitwise_xor(b1, b2)
    decrypted_g = cv2.bitwise_xor(g1, g2)
    decrypted_r = cv2.bitwise_xor(r1, r2)
    
    decrypted_image = cv2.merge([decrypted_b, decrypted_g, decrypted_r])

    decrypted_path = os.path.join("uploads", f"decrypted_{os.path.basename(share1_path)}")    
    cv2.imwrite(decrypted_path, decrypted_image)
    
    return decrypted_path

if __name__ == "__main__":
    try:
        if len(sys.argv) == 2:
            # Encrypt image
            image_path = sys.argv[1]
            share1, share2 = encrypt_image(image_path)
            print(json.dumps({
                "share1": share1,
                "share2": share2
            }))
        elif len(sys.argv) == 3:
            # Decrypt image
            share1_path = sys.argv[1]
            share2_path = sys.argv[2]
            decrypted_path = decrypt_image(share1_path, share2_path)
            print(json.dumps({
                "decrypted": os.path.basename(decrypted_path)
            }))
        else:
            print(json.dumps({"error": "Invalid number of arguments"}))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

# import cv2
# import numpy as np
# import sys
# import os
# import json

# def encrypt_image(image_path):
#     image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)  # Read original format
#     if image is None:
#         raise ValueError("Image not found or invalid file format.")

#     rows, cols = image.shape[:2]  # Get image dimensions

#     # Detect if the image is grayscale
#     is_grayscale = len(image.shape) == 2 or image.shape[2] == 1

#     # Generate a random share
#     random_share = np.random.randint(0, 256, size=(rows, cols), dtype=np.uint8)

#     if is_grayscale:
#         gray = image if len(image.shape) == 2 else image[:, :, 0]
#         share1 = random_share
#         share2 = cv2.bitwise_xor(gray, random_share)
#     else:
#         b, g, r = cv2.split(image)  # Split into color channels
#         share1_b, share2_b = random_share, cv2.bitwise_xor(b, random_share)
#         share1_g, share2_g = random_share, cv2.bitwise_xor(g, random_share)
#         share1_r, share2_r = random_share, cv2.bitwise_xor(r, random_share)
#         share1, share2 = cv2.merge([share1_b, share1_g, share1_r]), cv2.merge([share2_b, share2_g, share2_r])

#     # Save shares
#     upload_dir = "uploads"
#     os.makedirs(upload_dir, exist_ok=True)
    
#     base_name = os.path.basename(image_path)
#     share1_path = os.path.join(upload_dir, f"share1_{base_name}")
#     share2_path = os.path.join(upload_dir, f"share2_{base_name}")

#     cv2.imwrite(share1_path, share1)
#     cv2.imwrite(share2_path, share2)

#     return share1_path, share2_path

# def decrypt_image(share1_path, share2_path):
#     share1 = cv2.imread(share1_path, cv2.IMREAD_UNCHANGED)
#     share2 = cv2.imread(share2_path, cv2.IMREAD_UNCHANGED)

#     if share1 is None or share2 is None:
#         raise ValueError("Invalid share paths provided.")

#     # Detect grayscale images
#     is_grayscale = len(share1.shape) == 2 or share1.shape[2] == 1

#     if is_grayscale:
#         decrypted_image = cv2.bitwise_xor(share1, share2)
#     else:
#         b1, g1, r1 = cv2.split(share1)
#         b2, g2, r2 = cv2.split(share2)
#         decrypted_b, decrypted_g, decrypted_r = cv2.bitwise_xor(b1, b2), cv2.bitwise_xor(g1, g2), cv2.bitwise_xor(r1, r2)
#         decrypted_image = cv2.merge([decrypted_b, decrypted_g, decrypted_r])

#     decrypted_path = os.path.join("uploads", f"decrypted_{os.path.basename(share1_path)}")
#     cv2.imwrite(decrypted_path, decrypted_image)

#     return decrypted_path


# if __name__ == "__main__":
#     try:
#         if len(sys.argv) == 2:
#             # Encrypt image
#             image_path = sys.argv[1]
#             share1, share2 = encrypt_image(image_path)
#             print(json.dumps({
#                 "share1": share1,
#                 "share2": share2
#             }))
#         elif len(sys.argv) == 3:
#             # Decrypt image
#             share1_path = sys.argv[1]
#             share2_path = sys.argv[2]
#             decrypted_path = decrypt_image(share1_path, share2_path)
#             print(json.dumps({
#                 "decrypted": os.path.basename(decrypted_path)
#             }))
#         else:
#             print(json.dumps({"error": "Invalid number of arguments"}))
#             sys.exit(1)

#     except Exception as e:
#         print(json.dumps({"error": str(e)}))
#         sys.exit(1)
