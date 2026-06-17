import os

path = r'C:\Users\basir\OneDrive\Desktop\programs\trading-copilot\frontend\src\pages\Analysis.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'import { Upload, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from \'lucide-react\'',
    'import { Upload, TrendingUp, TrendingDown, Minus, AlertTriangle } from \'lucide-react\''
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed')