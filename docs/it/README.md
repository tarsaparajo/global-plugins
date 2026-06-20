**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | Italiano

# Global Plugins

![Global Plugins](../../assets/hero.png)

Un’unica fonte canonica, ogni provider. Genera, adatta ed evolvi plugin di IA per la programmazione da una singola descrizione.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | Italiano

---

## Panoramica

**Global Plugins** crea e mantiene plugin AI per la programmazione compatibili con più provider. Definisci un plugin una sola volta in una **sorgente canonica** indipendente dal provider; un motore deterministico la **proietta** nel formato nativo di ogni provider supportato. Le proiezioni sono artefatti versionati, mai modificati a mano, sempre rigenerati dalla sorgente canonica. Il risultato: un'unica verità, molti provider, perfettamente sincronizzati.

È pensato per chiunque voglia che un plugin funzioni ovunque senza dover mantenere una copia separata per ciascuno strumento, descritto in linguaggio semplice, senza richiedere competenze tecniche approfondite.

## Funzionalità

### GENERATE (genera)

Descrivi un plugin in linguaggio naturale e Global Plugins ne progetta l'intera architettura — skill, agenti, hook, comandi, permessi — proiettandola su ogni provider selezionato, con l'auto-evoluzione integrata di serie.

### ADAPT (adatta)

Indica un plugin sviluppato per un singolo provider e Global Plugins lo solleva alla forma canonica e lo proietta su tutti i provider, preservando il 100% delle sue funzionalità originali.

### EVOLVE (evolvi)

Ogni plugin prodotto viene fornito con il proprio motore di evoluzione: modifica la sorgente canonica una sola volta e la modifica si rispecchia su ogni provider, con validazione della parità, incremento di versione, una voce nel changelog e nel ledger, e una migrazione condizionale per le copie già installate. Una sola conferma prima che qualsiasi cosa venga scritta.

## Matrice dei provider

| Provider | Ambito | Radice | Trasformazione rilevante | Build |
|----------|--------|--------|--------------------------|-------|
| claude | home | `.claude` | copia; merge MCP | — |
| claude (project) | progetto | `.claude` | copia; merge MCP | — |
| codex | home | `.codex` | agenti in TOML; `AGENTS.md` + `config.toml` | — |
| opencode | home | `.opencode` | copia; plugin compilato sotto `dist/` | sì |
| cursor | progetto | `.cursor` | regole in `.mdc`; merge MCP | — |
| kiro | progetto | `.kiro` | agenti come `.md` + `.json`; merge MCP | — |
| gemini | progetto | `.gemini` | file unico `GEMINI.md` | — |
| qwen | home | `.qwen` | file unico `QWEN.md` | — |
| zed | progetto | `.zed` | regole flat; merge `settings.json` | — |
| codebuddy | progetto | `.codebuddy` | regole flat; script di installazione | — |
| joycode | progetto | `.joycode` | regole flat; script di installazione | — |
| antigravity | progetto | `.agent` | rimappa comandi/agenti su workflow/skill | — |
| trae | progetto | `.trae` | regole flat; script di installazione | — |
| vscode | progetto | `.github` | `copilot-instructions.md` consolidato + `.vscode/settings.json` | — |

**Ambito:** i provider *home* mantengono una configurazione globale per utente (una CLI); i provider *project* mantengono la configurazione all'interno del repository (un IDE/editor).

Il registro è aperto. È possibile aggiungere nuovi provider estendendo il registro con una voce reale, un contratto di provider, un modulo adapter e un test.

## Installazione

### Claude Code (nativo — target principale)

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

> I comandi `/plugin` qui sopra sono solo per Claude Code. Ogni altro provider si installa copiando la sua dotfolder versionata al posto giusto.

### Altri provider

La dotfolder di ciascun provider è un artefatto reale e pronto all'uso, rigenerato tramite ri-proiezione: non modificarla mai a mano. I provider *home* (CLI) si installano nella tua home directory; i provider *project* (IDE/editor) si installano nella radice del repository. Copia la dotfolder corrispondente:

| Provider | Ambito | Copia in |
|----------|--------|----------|
| codex | home | `~/.codex` |
| qwen | home | `~/.qwen` |
| opencode | home | `~/.opencode` — esegui prima `node engine/build-opencode.js` |
| cursor | progetto | `<repo>/.cursor` |
| kiro | progetto | `<repo>/.kiro` |
| gemini | progetto | `<repo>/.gemini` |
| zed | progetto | `<repo>/.zed` |
| codebuddy | progetto | `<repo>/.codebuddy` |
| joycode | progetto | `<repo>/.joycode` |
| antigravity | progetto | `<repo>/.agent` |
| trae | progetto | `<repo>/.trae` |
| vscode | progetto | `<repo>/.github` (+ `.vscode/settings.json`) |

Consulta la [Matrice dei provider](#provider-matrix) per la trasformazione esatta che ciascun provider applica.

## Utilizzo

| Comando | Cosa fa |
|---------|---------|
| `/global-plugins:generate <briefing>` | Genera un plugin multi-provider a partire da una descrizione. |
| `/global-plugins:adapt <path>` | Adatta a tutti i provider un plugin progettato per un singolo provider. |
| `/global-plugins:audit <path>` | Audit approfondito e in sola lettura di un plugin. |
| `/global-plugins:validate <path>` | Gate di validazione rapido con esito pass/fail. |
| `/global-plugins:harness-lens <idea>` | Esplora come verrebbe composta un'idea di plugin. |
| `/global-plugins:evolve <change>` | Rispecchia una modifica canonica su ogni provider, con parità, incremento di versione, changelog e una migrazione condizionale. |
| `/global-plugins:migrate [--dry-run \| --apply \| --rollback]` | Applica la catena di migrazioni in sospeso a una copia già installata. |

Global Plugins è auto-ospitante: fornisce la propria superficie evolve e migrate, e rispecchia gli stessi `/<plugin>:evolve` e `/<plugin>:migrate` in ogni plugin che genera.

## Architettura interna

Sorgente canonica → **resolver** (registro dei provider + manifest a 3 livelli: profili → moduli → componenti) → moduli di **proiezione** per provider → **executor** di proiezione. Una lente di progettazione composizionale modella l'harness di un plugin a partire da una richiesta in linguaggio naturale. La governance (sincronizzazione SemVer, changelog, parità, difesa dei prompt, conformità) è integrata nel motore.

## Licenza

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
