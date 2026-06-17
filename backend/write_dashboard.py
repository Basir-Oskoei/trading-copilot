path = r'C:\Users\basir\OneDrive\Desktop\programs\trading-copilot\backend\app\main.py'

with open(path, 'r') as f:
    content = f.read()

content = content.replace(
    'allow_origins=settings.ALLOWED_ORIGINS,',
    'allow_origins=["*"],'
)

with open(path, 'w') as f:
    f.write(content)

print('Fixed CORS')