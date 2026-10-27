# Validation plan and status

## Completed in this repository

- Node syntax checks and unit tests for synthetic scenario state, fixed reset values, bounded advancement, demo-score range, and rejected invalid inputs.
- A PlatformIO ESP32 compile is configured in CI; a successful compile would verify source/toolchain compatibility only.

## Not yet verified

- A local integrated-browser smoke test loaded the page, exercised both scenario controls, checked a 390 px viewport for horizontal document overflow, and captured a screenshot. No JavaScript console errors were captured. Google Fonts was blocked by the test environment and fallback fonts were used; Tailwind emitted its expected Play CDN production warning.
- No cross-browser/device matrix or physical mobile-device test has been run.
- No physical ESP32 board has been compiled/flashed or tested.
- No sensor interface, sensor conversion, calibration, reference comparison, uncertainty, drift, water sample, field deployment, privacy review, or certification exists.

## Before a controlled pilot

1. Select exact sensors, analog front ends, board revision, power architecture, enclosure, water-contact materials, and intended use.
2. Review schematics, maximum/fault voltages, isolation/grounding, protection, and environmental hazards with qualified hardware engineers.
3. Implement and independently test model-specific conversions and sensor-fault behavior against suitable references; document calibration traceability and uncertainty.
4. Establish pre-defined acceptance criteria, sampling/reference methods, repeatability, interference, drift, maintenance, and failure-mode tests.
5. Review user-facing labels and workflow with water-quality and public-health professionals; prohibit safety conclusions from incomplete parameters.
6. Review applicable permissions, ethics, privacy, data access/retention, incident escalation, and operational ownership before collecting or transmitting real data.

No pilot should be inferred as approved by completing software tests or a firmware compilation.
