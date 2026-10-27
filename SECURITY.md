# Security policy

## Supported scope

This is an early-stage demonstration repository. Security reports are welcome for the current default branch. There is no production service, remote API, authentication system, or operational sensor deployment.

## Reporting a vulnerability

Please do not publish secrets, personal data, exploit details, or sensitive water-system information in a public issue. Use GitHub's private vulnerability reporting feature for this repository if enabled; otherwise contact the repository maintainers privately through an approved organizational channel. Include affected file/version, impact, and safe reproduction details. Do not probe real water infrastructure or third-party systems.

There is no guaranteed response SLA until maintainers and an operating organization are designated.

## Current security boundaries

- The demo loads JavaScript/CSS/fonts from external CDNs. Review and pin dependency versions; the Tailwind Play CDN is not a production-grade asset pipeline.
- There is no user-controlled HTML input in the dashboard. Dynamic labels use text nodes; do not add unsanitized input to HTML sinks.
- The firmware emits data on USB serial only; it has no wireless/network functionality.
- Do not put credentials, private keys, tokens, real sample records, or personal data in this repository.

Security hardening is not a safety certification, hardware safety review, or authorization to deploy.
