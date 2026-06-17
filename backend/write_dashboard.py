path = r'C:\Users\basir\OneDrive\Desktop\programs\trading-copilot\frontend\src\pages\SessionScanner.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("{ display: 'flex', align: 'center'", "{ display: 'flex', alignItems: 'center'")
content = content.replace(", align: 'center'", ", alignItems: 'center'")
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed')