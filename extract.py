import re
with open('admin.html', 'r', encoding='utf-8') as f:
    html = f.read()
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
for i, s in enumerate(scripts):
    with open(f'test_{i}.js', 'w', encoding='utf-8') as sf:
        sf.write(s)
