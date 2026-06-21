# Migrations

This directory holds one `<version>.md` per breaking release. Each migration is independently runnable and reversible (dry-run, apply, rollback). The chain is monotonic and gapless.

| Version | From | Risk | Reversible |
|---------|------|------|------------|
| 1.0.0 | >=0.7.0 <1.0.0 | medium | yes |
