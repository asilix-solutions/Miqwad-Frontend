import sys
with open('src/modules/admin/pages/AdminProviderDetailsPage.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
with open('src/modules/admin/pages/AdminProviderDetailsPage.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines[:510] + lines[705:])
