#!/bin/bash
set -e

npm run build

# Guardar index de dev y poner el de producción
cp index.html index.dev.html
cp dist/index.html index.html
cp dist/404.html 404.html 2>/dev/null || true
rm -rf assets
cp -r dist/assets assets

git add index.html 404.html assets/ dist/
git commit -m "build: actualizar compilado GH Pages"
git push origin "$(git branch --show-current)"

# Restaurar index de dev (para que npm run dev siga funcionando)
cp index.dev.html index.html
rm index.dev.html

echo "✓ Deploy completado → https://shirslock.github.io/siaj/"
