rm -rf ./chrome-dist

mkdir chrome-dist

cp -r css chrome-dist/css
cp -r src chrome-dist/src
cp -r icons chrome-dist/icons
cp -r manifest.json chrome-dist
cp -r schema.json chrome-dist

cd chrome-dist

find . -type f -name "*.js" -exec sed -i '' 's/browser/chrome/g' {} \;

sed -i '' '$d' manifest.json
sed -i '' '$d' manifest.json
sed -i '' '$d' manifest.json
sed -i '' '$d' manifest.json
sed -i '' '$d' manifest.json
sed -i '' '$d' manifest.json

echo "\"storage\": {\"managed_schema\": \"schema.json\"}" >> manifest.json
echo "}" >> manifest.json