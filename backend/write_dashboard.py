import os

files = [
    r'C:\Users\basir\OneDrive\Desktop\programs\trading-copilot\frontend\src\pages\SessionScanner.tsx',
    r'C:\Users\basir\OneDrive\Desktop\programs\trading-copilot\frontend\src\pages\MTFAnalysis.tsx',
    r'C:\Users\basir\OneDrive\Desktop\programs\trading-copilot\frontend\src\pages\Backtester.tsx',
]

for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(
        "import.meta.env.VITE_API_URL || 'http://localhost:8000'",
        "import.meta.env.VITE_API_URL || 'https://trading-copilot-production-d56d.up.railway.app'"
    )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed:', os.path.basename(path))

print('Done')