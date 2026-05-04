// Simple script to generate index.html with redirect to /app.somespai/ca/
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../out');
const indexHtml = `<!DOCTYPE html>
<html lang="ca">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=/app.somespai/ca/" />
    <script>window.location.replace('/app.somespai/ca/');</script>
    <title>Somespai</title>
  </head>
  <body>
    <p>Redirigint a <a href="/app.somespai/ca/">/app.somespai/ca/</a>...</p>
  </body>
</html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);
console.log('index.html de redirección generado.');
