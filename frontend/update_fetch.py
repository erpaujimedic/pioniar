import os
import re

directory = 'c:/Web App Running TMC/Pioniar/frontend/src'
for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = re.sub(r"fetch\('/api/", "fetch((import.meta.env.VITE_API_BASE_URL || '') + '/api/", content)
            new_content = re.sub(r'fetch\("/api/', 'fetch((import.meta.env.VITE_API_BASE_URL || \'\') + "/api/', new_content)
            new_content = re.sub(r"fetch\(`/api/", "fetch((import.meta.env.VITE_API_BASE_URL || '') + `/api/", new_content)
            
            if content != new_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
