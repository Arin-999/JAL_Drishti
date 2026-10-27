# Contributing

Thanks for helping improve this prototype. Keep changes scoped, readable, and testable.

## Before opening a pull request

1. Describe the user/problem impact and the smallest complete change.
2. Keep the existing dependency-light HTML/CSS/JavaScript approach unless a migration is justified.
3. Run `npm run check` and `npm test`. If firmware changes, run `pio run --project-dir .\firmware`.
4. For UI changes, manually check the scenario/reset controls, browser console, and a narrow viewport.
5. Update the README or relevant documentation when behavior, hardware assumptions, dependencies, or setup changes.
6. State what was actually tested; do not claim tests, measurements, certifications, or field validation that were not performed.

## Safety and evidence

- Keep all generated data clearly labeled synthetic.
- Never claim that this prototype certifies drinking-water safety.
- The displayed pH/TDS/turbidity/temperature set cannot directly detect arsenic, fluoride, or pathogens.
- Do not add unverified limits, calibration constants, research findings, field deployments, credentials, personal information, or secrets.
- Hardware changes must identify exact models and datasheets, voltage limits, wiring assumptions, calibration provenance, and failure behavior. Do not present generic pin assignments as universal.
- Preserve third-party license notices and cite primary research sources precisely when evidence is added.

Use the issue and pull-request templates. Report security issues privately as described in [SECURITY.md](SECURITY.md).
