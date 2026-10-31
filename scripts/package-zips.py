import os
import zipfile
import shutil

rootDir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
distDir = os.path.join(rootDir, 'dist')
publicDir = os.path.join(rootDir, 'public')

# Clean any existing zips inside dist
for item in os.listdir(distDir):
    if item.endswith('.zip'):
        try:
            os.remove(os.path.join(distDir, item))
        except:
            pass

# Zip 1: threadlab-github-pages.zip
# Exclude any zip files or temp files
pages_zip = os.path.join(publicDir, 'threadlab-github-pages.zip')
with zipfile.ZipFile(pages_zip, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(distDir):
        for f in files:
            if f.endswith('.zip') or f.startswith('.'):
                if f != '.nojekyll':
                    continue
            absPath = os.path.join(root, f)
            arcPath = os.path.relpath(absPath, distDir)
            z.write(absPath, arcPath)

print(f"[Zip] Created {pages_zip} ({os.path.getsize(pages_zip):,} bytes)")

# Zip 2: threadlab-standalone-index.zip (Just single-file index.html + .nojekyll + csv + sitemap)
standalone_zip = os.path.join(publicDir, 'threadlab-standalone-index.zip')
with zipfile.ZipFile(standalone_zip, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in ['index.html', '404.html', '.nojekyll', 'products.csv', 'sitemap.xml', 'robots.txt']:
        p = os.path.join(distDir, f)
        if os.path.exists(p):
            z.write(p, f)

print(f"[Zip] Created {standalone_zip} ({os.path.getsize(standalone_zip):,} bytes)")
