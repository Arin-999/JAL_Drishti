# Local demo and deployment notes

## Local development

Run from the repository root:

```powershell
npm run check
npm test
py -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000>. A static HTTP server is needed for JavaScript modules/import maps. No environment variables or backend are required.

## Static hosting

The browser-only demo can be hosted as static files, including on GitHub Pages after repository review and approval. Publish the contents of the default branch using the host's supported static-site mechanism. Keep `index.html`, `src/`, and all referenced paths together. The demo still depends on external CDNs and does not become a sensor service when hosted.

Before public hosting, review third-party CDN terms, privacy implications of external font/library requests, dependency integrity/update policy, accessibility, and any organizational approval. The Tailwind Play CDN is not a production build pipeline.

## No device deployment path

The PlatformIO firmware is built separately and emits raw sample estimates over USB serial. There is no supported mechanism for a hosted site to access an ESP32 or receive sensor data. Do not add a direct browser/device or network connection without an explicit authenticated protocol design, threat model, privacy review, data validation, and operational safety assessment.
