**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | Deutsch | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | Deutsch | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

---

## Überblick

**Global Plugins** erstellt und pflegt providerübergreifende KI-Coding-Plugins. Du schreibst ein Plugin ein einziges Mal in einer providerneutralen **kanonischen Quelle**; eine deterministische Engine **projiziert** es in das native Format jedes unterstützten Providers. Die Projektionen sind versionierte Artefakte – niemals von Hand bearbeitet, sondern stets aus der kanonischen Quelle neu generiert. Das Ergebnis: eine einzige Wahrheit, viele Provider, perfekt synchron.

Es richtet sich an alle, die wollen, dass ein Plugin überall funktioniert, ohne pro Tool eine separate Kopie pflegen zu müssen – in einfacher Sprache beschrieben, ohne dass tiefes technisches Wissen nötig ist.

## Fähigkeiten

### GENERATE (Erzeugen)

Beschreibe ein Plugin in natürlicher Sprache, und Global Plugins entwirft dessen vollständige Architektur – Skills, Agents, Hooks, Commands, Berechtigungen – und projiziert es auf jeden ausgewählten Provider, mit eingebauter Selbstevolution.

### ADAPT (Anpassen)

Zeige auf ein für einen einzelnen Provider gebautes Plugin, und Global Plugins hebt es in die kanonische Form und projiziert es auf alle Provider – unter Erhalt von 100 % seiner ursprünglichen Funktionalität.

### EVOLVE (Weiterentwickeln)

Jedes erzeugte Plugin wird mit einer eigenen Evolutions-Engine ausgeliefert: Bearbeite die kanonische Quelle ein einziges Mal, und die Änderung wird auf jeden Provider gespiegelt – mit Paritätsvalidierung, einer Versionsanhebung, einem Changelog- und Ledger-Eintrag sowie einer bedingten Migration für bereits installierte Kopien. Eine einzige Bestätigung, bevor irgendetwas geschrieben wird.

## Provider-Matrix

| Provider | Geltungsbereich | Root | Wesentliche Transformation | Build |
|----------|-------|------|-------------------|-------|
| claude | home | `.claude` | Kopie; MCP-Merge | — |
| claude (project) | project | `.claude` | Kopie; MCP-Merge | — |
| codex | home | `.codex` | Agents nach TOML; `AGENTS.md` + `config.toml` | — |
| opencode | home | `.opencode` | Kopie; kompiliertes Plugin unter `dist/` | ja |
| cursor | project | `.cursor` | Rules nach `.mdc`; MCP-Merge | — |
| kiro | project | `.kiro` | Agents als `.md` + `.json`; MCP-Merge | — |
| gemini | project | `.gemini` | Einzeldatei `GEMINI.md` | — |
| qwen | home | `.qwen` | Einzeldatei `QWEN.md` | — |
| zed | project | `.zed` | Rules flach; `settings.json`-Merge | — |
| codebuddy | project | `.codebuddy` | Rules flach; Installationsskript | — |
| joycode | project | `.joycode` | Rules flach; Installationsskript | — |
| antigravity | project | `.agent` | Commands/Agents auf Workflows/Skills umgemappt | — |
| trae | project | `.trae` | Rules flach; Installationsskript | — |
| vscode | project | `.github` | konsolidierte `copilot-instructions.md` + `.vscode/settings.json` | — |

**Geltungsbereich:** *home*-Provider halten eine globale Konfiguration pro Benutzer vor (ein CLI); *project*-Provider halten die Konfiguration innerhalb des Repositorys (eine IDE/ein Editor).

Die Registry ist offen. Neue Provider lassen sich hinzufügen, indem man die Registry um einen echten Eintrag, einen Provider-Vertrag, ein Adapter-Modul und einen Test erweitert.

## Installation

Installiere das Plugin über einen Plugin-Marktplatz oder manuell, indem du dieses Verzeichnis an deinen Plugin-Speicherort kopierst. Die versionierten Provider-Dotfolder sind echte Artefakte, die durch erneute Projektion regeneriert werden – bearbeite sie niemals von Hand.

## Verwendung

| Command | Was es tut |
|---------|--------------|
| `/global-plugins:generate <briefing>` | Erzeugt aus einer Beschreibung ein providerübergreifendes Plugin. |
| `/global-plugins:adapt <path>` | Passt ein Einzelprovider-Plugin an alle Provider an. |
| `/global-plugins:audit <path>` | Tiefgehendes, schreibgeschütztes Audit eines Plugins. |
| `/global-plugins:validate <path>` | Schnelles Pass/Fail-Validierungsgate. |
| `/global-plugins:harness-lens <idea>` | Erkundet, wie eine Plugin-Idee zusammengesetzt würde. |

Erzeugte Plugins liefern zusätzlich `/<plugin>:evolve` und `/<plugin>:migrate` zur Selbstevolution mit.

## Interne Architektur

Kanonische Quelle → **Resolver** (Provider-Registry + 3-stufige Manifeste: Profile → Module → Komponenten) → providerspezifische **Projektions**-Module → Projektions-**Executor**. Eine kompositionelle Design-Lens formt das Gerüst eines Plugins aus einer Anfrage in natürlicher Sprache. Governance (SemVer-Synchronisation, Changelog, Parität, Prompt-Defense, Compliance) ist in die Engine eingebaut.

## Lizenz

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
