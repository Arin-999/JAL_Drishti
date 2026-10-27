# Architecture and data flow

## Browser demo

The project is a static page, served locally over HTTP:

1. `index.html` provides dashboard markup and an import map for Three.js `0.150.1`.
2. `src/app.js` initializes the 3D scene, animation loop, Chart.js plot, and DOM event handlers.
3. `src/scenarios.js` provides pure scenario/state/score functions. It does not read the DOM, browser storage, or network.
4. `tests/scenarios.test.js` exercises those functions using Node's built-in test runner.

The dashboard simulation runs only in the browser. `Math.random()` perturbs synthetic temperature, pH, and TDS values; scenario turbidity is fixed at the configured demo value. No browser-to-board communication exists.

## Optional firmware

```text
ADC1 GPIOs → analogReadMilliVolts → 16-sample mean → JSON line over USB serial
```

Serial is a separate development-only output. There is no serial parser or import into the web application, no Wi-Fi or server, and no persistence.

## Trust boundaries and external dependencies

- The page loads pinned Three.js, Chart.js, and Tailwind script resources, plus web fonts, from third-party CDNs. Availability and supply-chain integrity depend on those providers and the browser's network. Tailwind Play CDN is demo tooling, not a production asset pipeline.
- The browser display has no external user-input form. Dynamic event and heuristic text is inserted as text; score-bar nodes are built with DOM APIs.
- Firmware input values originate at analog pins and are not calibrated or treated as trusted engineering-unit measurements.
- There are no secrets, accounts, API keys, personal records, or remote telemetry in the project.

## Deliberately absent components

There is no backend, cloud, database, authentication, machine-learning model, alarm delivery, water-safety classification, or real-time sensor integration. Adding any of these requires a separate requirements, threat, privacy, safety, and validation review.
