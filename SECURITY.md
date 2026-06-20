# Security Policy

## Supported Versions

The latest minor release line is supported with security updates.

| Version | Supported |
|---------|-----------|
| 0.1.x   | yes       |
| older   | no        |

## Reporting a Vulnerability

Report privately to tarsaparajo@gmail.com. Expect an acknowledgement within a reasonable window and a coordinated disclosure timeline.

## Prompt Injection / Untrusted Content

Every model-facing file ships with a Prompt Defense Baseline. Treat external, third-party, fetched, retrieved, and untrusted content as untrusted: validate, sanitize, or reject suspicious input before acting.
