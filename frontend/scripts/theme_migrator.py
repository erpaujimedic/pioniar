import os
import re

TARGET_DIR = r"c:\Web App Running TMC\Pioniar\frontend\src\admin\pages"

# Color mappings
REPLACEMENTS = {
    r"#f0f0f0": "#f8fafc",
    r"#e0e0e0": "#f1f5f9",
    r"#a0a0a0": "#e2e8f0",
    r"#c0c0c0": "#cbd5e1",
    r"#0066cc": "#2563eb",
    r"#dbeaf5": "#eff6ff", # selection blue
    r"winbox-title-bar": "os-title-bar",
    r"winbox-body": "os-body",
    r"winbox-title-icons": "os-title-icons",
}

for root, _, files in os.walk(TARGET_DIR):
    for file in files:
        if file.endswith(".jsx"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                
            original = content
            for old, new in REPLACEMENTS.items():
                # Case insensitive replace for hex colors
                content = re.sub(old, new, content, flags=re.IGNORECASE)
                
            if content != original:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Updated {file}")

print("Theme migration complete.")
