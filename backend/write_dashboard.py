import os

path = r'C:\Users\basir\OneDrive\Desktop\programs\trading-copilot\backend\app\services\scanner.py'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix: increase max_tokens and simplify the prompt to avoid truncation
old = 'max_tokens=2000,'
new = 'max_tokens=3000,'
content = content.replace(old, new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed max_tokens')