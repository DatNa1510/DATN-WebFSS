"""
FSS DATA GENERATOR
Filter 1000 fashion products (Apparel, Footwear, Accessories)
with existing image files for Web FSS project.
"""

import csv
import json
import os
import random
import shutil
import sys

# Fix encoding + force line-buffering to prevent mixed output on Windows
sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

# ─── CONFIG ───────────────────────────────────────
BASE_DIR    = r"d:\DATN\archive\fashion-dataset"
STYLES_CSV  = os.path.join(BASE_DIR, "styles.csv")
IMAGES_DIR  = os.path.join(BASE_DIR, "images")

OUT_DIR     = r"d:\DATN\Web_FSS\fashion-dataset"
OUT_JSON    = os.path.join(OUT_DIR, "products_1000.json")
OUT_CSV     = os.path.join(OUT_DIR, "products_1000.csv")
OUT_IMGS    = os.path.join(OUT_DIR, "images")

CATEGORIES  = {"Apparel", "Footwear", "Accessories"}
TARGET      = 1000
RANDOM_SEED = 42

# ─── CREATE OUTPUT DIRS ────────────────────────────
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(OUT_IMGS, exist_ok=True)

print("=" * 60)
print("  FSS DATA GENERATOR - Starting...")
print("=" * 60)

# ─── STEP 1: READ + FILTER styles.csv ─────────────
print("\n[STEP 1] Reading and filtering styles.csv ...")

all_products = []
total_rows   = 0
skipped_bad  = 0

with open(STYLES_CSV, encoding="utf-8", errors="replace") as f:
    reader = csv.DictReader(f)
    for row in reader:
        total_rows += 1
        try:
            cat = row.get("masterCategory", "").strip()
            subCat = row.get("subCategory", "").strip()
            gender = row.get("gender", "").strip()
            
            # Exclude innerwear, loungewear, and kids (Boys, Girls)
            if cat in CATEGORIES and subCat not in {"Innerwear", "Loungewear and Nightwear"} and gender not in {"Boys", "Girls"}:
                all_products.append({
                    "id"                : int(row["id"]),
                    "gender"            : gender,
                    "masterCategory"    : cat,
                    "subCategory"       : subCat,
                    "articleType"       : row.get("articleType", "").strip(),
                    "baseColour"        : row.get("baseColour", "").strip(),
                    "season"            : row.get("season", "").strip(),
                    "year"              : row.get("year", "").strip(),
                    "usage"             : row.get("usage", "").strip(),
                    "productDisplayName": row.get("productDisplayName", "").strip(),
                })
        except (ValueError, KeyError):
            skipped_bad += 1

print(f"  -> Total CSV rows      : {total_rows:,}")
print(f"  -> Skipped/bad rows    : {skipped_bad}")
print(f"  -> Valid products found: {len(all_products):,} in {CATEGORIES}")

# ─── STEP 2: SHUFFLE ──────────────────────────────
print(f"\n[STEP 2] Shuffling randomly (seed={RANDOM_SEED}) ...")
random.seed(RANDOM_SEED)
random.shuffle(all_products)
print(f"  -> Shuffled {len(all_products):,} products")

# ─── STEP 3: FILTER BY EXISTING IMAGE ─────────────
print(f"\n[STEP 3] Checking image files, extracting {TARGET} products ...")

selected       = []
checked        = 0
missing_imgs   = 0
category_count = {}
gender_count   = {}

for product in all_products:
    if len(selected) >= TARGET:
        break

    checked += 1
    img_path = os.path.join(IMAGES_DIR, f"{product['id']}.jpg")

    if not os.path.isfile(img_path):
        missing_imgs += 1
        continue

    # Copy image to output folder
    dest_path = os.path.join(OUT_IMGS, f"{product['id']}.jpg")
    shutil.copy2(img_path, dest_path)

    # Add relative image URL
    product["imageUrl"] = f"/fashion-dataset/images/{product['id']}.jpg"
    selected.append(product)

    # Stats
    cat = product["masterCategory"]
    gen = product["gender"]
    category_count[cat] = category_count.get(cat, 0) + 1
    gender_count[gen]   = gender_count.get(gen, 0) + 1

    # Progress every 100
    if len(selected) % 100 == 0:
        print(f"  -> Selected {len(selected):>4}/{TARGET} | "
              f"Checked: {checked:,} | Missing images: {missing_imgs}")

print(f"\n  -> Total checked    : {checked:,}")
print(f"  -> Missing images   : {missing_imgs:,}")
print(f"  -> Products selected: {len(selected)}")

# ─── STEP 4: EXPORT JSON ──────────────────────────
print(f"\n[STEP 4] Exporting JSON -> {OUT_JSON}")
with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(selected, f, ensure_ascii=False, indent=2)
print(f"  -> Saved {len(selected)} products to JSON")

# ─── STEP 5: EXPORT CSV ───────────────────────────
print(f"\n[STEP 5] Exporting CSV -> {OUT_CSV}")
fieldnames = [
    "id", "gender", "masterCategory", "subCategory",
    "articleType", "baseColour", "season", "year",
    "usage", "productDisplayName", "imageUrl"
]
with open(OUT_CSV, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(selected)
print(f"  -> Saved {len(selected)} rows to CSV")

# ─── STEP 6: STATS REPORT ─────────────────────────
print("\n" + "=" * 60)
print("  FINAL REPORT")
print("=" * 60)
print(f"\n  Total exported: {len(selected)} products\n")

print("  By Category:")
for cat, cnt in sorted(category_count.items(), key=lambda x: -x[1]):
    pct = cnt / len(selected) * 100
    bar = "#" * (cnt // 20)
    print(f"    {cat:<15}: {cnt:>4} ({pct:5.1f}%) {bar}")

print("\n  By Gender:")
for gen, cnt in sorted(gender_count.items(), key=lambda x: -x[1]):
    pct = cnt / len(selected) * 100
    print(f"    {gen:<10}: {cnt:>4} ({pct:5.1f}%)")

# Top 10 colours
colour_count = {}
for p in selected:
    c = p["baseColour"]
    colour_count[c] = colour_count.get(c, 0) + 1
top_colours = sorted(colour_count.items(), key=lambda x: -x[1])[:10]

print("\n  Top 10 Colours:")
for colour, cnt in top_colours:
    pct = cnt / len(selected) * 100
    print(f"    {colour:<20}: {cnt:>4} ({pct:5.1f}%)")

# Top article types
article_count = {}
for p in selected:
    a = p["articleType"]
    article_count[a] = article_count.get(a, 0) + 1
top_articles = sorted(article_count.items(), key=lambda x: -x[1])[:10]

print("\n  Top 10 Article Types:")
for art, cnt in top_articles:
    pct = cnt / len(selected) * 100
    print(f"    {art:<25}: {cnt:>4} ({pct:5.1f}%)")

print("\n" + "=" * 60)
print("  DONE! Dataset ready for Web FSS.")
print(f"\n  Output folder: {OUT_DIR}")
print(f"  JSON file    : products_1000.json")
print(f"  CSV file     : products_1000.csv")
print(f"  Images folder: images/ ({len(selected)} images)")
print("=" * 60 + "\n")
