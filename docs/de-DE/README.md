<div align="center">

**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | Deutsch | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

Eine kanonische Quelle, jeder Provider. Generiere, adaptiere und entwickle KI-Coding-Plugins aus einer einzigen Beschreibung.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-0.7.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | Deutsch | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

</div>

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

| Provider | Geltungsbereich | Repo-Ordner | Installiert nach | Wesentliche Transformation | Build |
|----------|-------|-------------|------------------|-------------------|-------|
| claude | home | `.claude` | Marketplace / `~/.claude` | Kopie; MCP-Merge | — |
| codex | home | `.codex` | `~/.codex` | Agents nach TOML; `AGENTS.md`-Index + Geschwisterdateien für Skills/Commands + `config.toml` | — |
| opencode | home | `.opencode` | `~/.config/opencode` | Kopie; kompiliertes Plugin unter `dist/` | ja |

**Geltungsbereich:** Alle drei sind *home*-Provider (CLIs) – jeder hält eine globale Konfiguration pro Benutzer vor. **Repo-Ordner** ist der Name des Dotfolders in diesem Repository (die Projektionsquelle); **Installiert nach** ist der Ort, an dem du ihn ablegst, damit der jeweilige Provider ihn liest.

Die Registry ist offen. Neue Provider lassen sich hinzufügen, indem man die Registry um einen echten Eintrag, einen Provider-Vertrag, ein Adapter-Modul und einen Test erweitert.

## Installation

Der committete Dotfolder jedes Providers ist ein echtes, einsatzbereites Artefakt, das durch erneute Projektion regeneriert wird – bearbeite ihn niemals von Hand. Wähle unten deinen Provider.

### Claude Code

Claude Code installiert aus einem Plugin-Marketplace – kein Klonen nötig:

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

Die `/plugin`-Befehle gelten nur für Claude Code.

### Codex

Codex bietet keine Marketplace-Installation für dieses Plugin, klone also das Repository und kopiere dessen `.codex`-Ordner in das globale Konfigurationsverzeichnis von Codex:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
mkdir -p ~/.codex
cp -R .codex/. ~/.codex/
```

Codex liest `~/.codex/`: Es erkennt `~/.codex/config.toml`, den `AGENTS.md`-Index, die `[agents.<name>]`-Rollen und die Geschwisterdateien für `skills/`/`commands/` automatisch, sobald du `codex` das nächste Mal ausführst.

### opencode

opencode bietet keine Marketplace-Installation für dieses Plugin, klone also das Repository, baue das kompilierte Plugin und kopiere dann dessen `.opencode`-Ordner in das globale Konfigurationsverzeichnis von opencode:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
node engine/build-opencode.js          # das kompilierte Plugin bauen (erzeugt .opencode/dist/)
mkdir -p ~/.config/opencode
cp -R .opencode/. ~/.config/opencode/
```

opencode liest seine globale Konfiguration aus `~/.config/opencode/` (nicht `~/.opencode/`). Der Build-Schritt ist vor der Nutzung erforderlich; er erzeugt `.opencode/dist/`.

Siehe die [Provider-Matrix](#provider-matrix) für die genaue Transformation, die jeder Provider anwendet.

## Verwendung

| Command | Was es tut |
|---------|--------------|
| `/global-plugins:generate <briefing>` | Erzeugt aus einer Beschreibung ein providerübergreifendes Plugin. |
| `/global-plugins:adapt <path>` | Passt ein Einzelprovider-Plugin an alle Provider an. |
| `/global-plugins:audit <path>` | Tiefgehendes, schreibgeschütztes Audit eines Plugins. |
| `/global-plugins:validate <path>` | Schnelles Pass/Fail-Validierungsgate. |
| `/global-plugins:harness-lens <idea>` | Erkundet, wie eine Plugin-Idee zusammengesetzt würde. |
| `/global-plugins:evolve <change>` | Spiegelt eine kanonische Änderung auf jeden Provider, mit Parität, einer Versionsanhebung, einem Changelog und einer bedingten Migration. |
| `/global-plugins:migrate [--dry-run \| --apply \| --rollback]` | Wendet die ausstehende Migrationskette auf eine bereits installierte Kopie an. |

Global Plugins ist selbsttragend: Es liefert seine eigene evolve- und migrate-Oberfläche mit und spiegelt dieselben `/<plugin>:evolve` und `/<plugin>:migrate` in jedes Plugin, das es erzeugt.

**Generiere von jedem Anbieter — nicht nur von Claude Code.** Die Projektions-Engine reist mit jeder Installation als Runtime-Payload mit, sodass ein installiertes Plugin selbst multi-anbieterfähige Kind-Plugins aus allen drei CLIs erstellen/anpassen/weiterentwickeln kann. Claude Code trägt sie über die Installation des gesamten Repositorys; **Codex** und **opencode** tragen sie unter einem reservierten Unterverzeichnis `_engine/` (`~/.codex/_engine/`, `~/.config/opencode/_engine/`). Unter Codex führt der Agent die gebündelte Engine mit Node aus (`cd ~/.codex/_engine && node scripts/evolve/project.mjs`, mit einer Freigabe pro Ausführung); unter opencode stellt das kompilierte Plugin in `dist/` native Werkzeuge `generate`/`adapt`/`evolve`/`validate`/`migrate` bereit, die auf demselben Payload aufbauen. Auch jedes erzeugte Kind bringt die Engine mit und ist daher eigenständig und selbst neu projizierbar.

## Interne Architektur

Kanonische Quelle → **Resolver** (Provider-Registry + 3-stufige Manifeste: Profile → Module → Komponenten) → providerspezifische **Projektions**-Module → Projektions-**Executor**. Eine kompositionelle Design-Lens formt das Gerüst eines Plugins aus einer Anfrage in natürlicher Sprache. Governance (SemVer-Synchronisation, Changelog, Parität, Prompt-Defense, Compliance) ist in die Engine eingebaut.

## Lizenz

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
