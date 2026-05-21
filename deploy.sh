#!/bin/bash
set -e

echo "Buildeando para GH Pages con base /siaj/..."
npm run build -- --mode ghpages

echo "Copiando a raiz..."
cp dist/index.html ./index.html
cp dist/404.html ./404.html 2>/dev/null || true
rm -rf ./assets
cp -r dist/assets ./assets

echo "Commiteando y pusheando..."
git add index.html 404.html assets/
git commit -m "build: actualizar compilado GH Pages"
git push origin "$(git branch --show-current)"

echo "Deploy GH Pages completado en rama $(git branch --show-current)"
