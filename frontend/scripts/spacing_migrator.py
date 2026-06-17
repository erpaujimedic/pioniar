import re
import os

TARGET_DIR = r"c:\Web App Running TMC\Pioniar\frontend\src\admin\pages"

for root, _, files in os.walk(TARGET_DIR):
    for file in files:
        if file.endswith(".jsx"):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            original = content
            content = re.sub(r"padding: '2px'", "padding: '6px 8px'", content)
            content = re.sub(r"padding: '2px 6px'", "padding: '8px 12px'", content)
            content = re.sub(r"padding: '2px 8px'", "padding: '6px 12px'", content)
            content = re.sub(r"fontSize: '11px'", "fontSize: '13px'", content)

            if content != original:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Spacing updated for {file}")
