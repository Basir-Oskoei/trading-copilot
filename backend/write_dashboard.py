import os, json

path = r'C:\Users\basir\OneDrive\Desktop\programs\trading-copilot\frontend\vercel.json'

config = {
    "rewrites": [
        {"source": "/(.*)", "destination": "/index.html"}
    ]
}

with open(path, 'w') as f:
    json.dump(config, f, indent=2)

print('Created vercel.json')