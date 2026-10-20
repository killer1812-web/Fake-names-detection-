#!/usr/bin/env python3
"""
Synthetic Dataset Generator for Fake Name & Synthetic Identity Analytics System.
Generates fictional identity records using Faker with controlled noise, duplicates,
placeholder phrases, formatting issues, and synthetic labels for experimental demonstration.
"""

import os
import csv
import random
import uuid
import datetime
from pathlib import Path
from faker import Faker

def generate_synthetic_dataset(
    num_records: int = 10000,
    seed: int = 42,
    output_path: str = "data/synthetic_identities_10k.csv",
    sample_path: str = "data/sample/sample_synthetic_identities.csv"
):
    print(f"[*] Initializing Synthetic Identity Generator with seed {seed}...")
    random.seed(seed)
    Faker.seed(seed)
    fake = Faker(['en_US', 'en_GB', 'es_ES', 'fr_FR', 'de_DE'])

    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    sample_file = Path(sample_path)
    sample_file.parent.mkdir(parents=True, exist_ok=True)

    placeholder_names = [
        "Test User", "Tester", "Demo User", "Placeholder", "Fake Name",
        "Dummy User", "Asdf Asdf", "Qwerty Qwerty", "Admin", "Anonymous",
        "Sample Record", "Null", "User Unknown", "No Name", "Tester One"
    ]

    records = []
    
    # Target distribution:
    # ~80% Plausible Normal Records (label = 0)
    # ~20% Synthetic Irregularities / Placeholders / Formatting Anomaly (label = 1)
    
    for i in range(num_records):
        rec_id = f"SYN-{uuid.uuid4().hex[:10].upper()}"
        is_irregular = random.random() < 0.20
        date_created = fake.date_between(start_date='-2y', end_date='today').isoformat()

        if not is_irregular:
            # Plausible Normal Identity
            full_name = fake.name()
            # Natural multicultural variation: sometimes hyphenated, sometimes middle name
            first = full_name.split()[0].lower()
            last = full_name.split()[-1].lower() if len(full_name.split()) > 1 else "user"
            email = f"{first}.{last}{random.randint(1, 999)}@{fake.free_email_domain()}"
            phone = fake.phone_number()
            city = fake.city()
            label = 0
        else:
            # Synthetic Irregularity / Test / Formatting anomaly
            irregular_type = random.choice([
                "placeholder", "digit_in_name", "special_chars", "whitespace",
                "disposable_email", "repeated_phone", "missing_fields"
            ])

            if irregular_type == "placeholder":
                full_name = random.choice(placeholder_names)
                email = f"{full_name.lower().replace(' ', '')}@example.com"
                phone = "555-0100"
                city = fake.city()
                label = 1

            elif irregular_type == "digit_in_name":
                base_name = fake.name()
                full_name = f"{base_name}{random.randint(10, 999)}"
                email = fake.email()
                phone = fake.phone_number()
                city = fake.city()
                label = 1

            elif irregular_type == "special_chars":
                base_name = fake.name()
                symbol = random.choice(["!", "#", "$", "%", "*", "_"])
                full_name = f"{base_name}{symbol}"
                email = fake.email()
                phone = fake.phone_number()
                city = fake.city()
                label = 1

            elif irregular_type == "whitespace":
                base_name = fake.name()
                full_name = f"  {base_name}   "
                email = fake.email()
                phone = fake.phone_number()
                city = fake.city()
                label = 1

            elif irregular_type == "disposable_email":
                full_name = fake.name()
                disp_domain = random.choice(["tempmail.com", "mailinator.com", "10minutemail.com", "example.com"])
                email = f"user_{random.randint(100, 999)}@{disp_domain}"
                phone = fake.phone_number()
                city = fake.city()
                label = 1

            elif irregular_type == "repeated_phone":
                full_name = fake.name()
                email = fake.email()
                phone = random.choice(["0000000000", "1111111111", "9999999999", "1234567890"])
                city = fake.city()
                label = 1

            else: # missing fields
                full_name = fake.name()
                email = "" if random.random() < 0.7 else fake.email()
                phone = "" if random.random() < 0.7 else fake.phone_number()
                city = "" if random.random() < 0.5 else fake.city()
                label = 1 if (not email and not phone) else 0

        records.append({
            "record_id": rec_id,
            "full_name": full_name,
            "email": email,
            "phone": phone,
            "city": city,
            "date_created": date_created,
            "synthetic_label": label
        })

    # Inject intentional duplicates (~300 duplicate pairs)
    print("[*] Injecting controlled duplicate record clusters...")
    num_dups = 300
    for _ in range(num_dups):
        target = random.choice(records[:num_records - num_dups])
        dup_rec = {
            "record_id": f"SYN-{uuid.uuid4().hex[:10].upper()}",
            "full_name": target["full_name"],
            "email": target["email"],
            "phone": target["phone"],
            "city": target["city"],
            "date_created": target["date_created"],
            "synthetic_label": target["synthetic_label"]
        }
        records.append(dup_rec)

    # Shuffle to distribute duplicates
    random.shuffle(records)

    fieldnames = ["record_id", "full_name", "email", "phone", "city", "date_created", "synthetic_label"]

    print(f"[*] Writing {len(records)} records to {output_path}...")
    with open(out_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    # Write a smaller sample file (500 records) for fast demo / git repo
    print(f"[*] Writing 500-sample records to {sample_path}...")
    with open(sample_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records[:500])

    print("[+] Synthetic dataset generated successfully!")
    print(f"    - Full dataset: {out_file.resolve()} ({len(records)} rows)")
    print(f"    - Sample dataset: {sample_file.resolve()} (500 rows)")

if __name__ == "__main__":
    generate_synthetic_dataset()
