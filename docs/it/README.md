**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | Italiano

# Global Plugins

![Global Plugins](../../assets/hero.png)

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

Installa da un marketplace di plugin oppure manualmente copiando questa directory nella tua posizione dei plugin. Le cartelle dotfolder dei provider versionate sono artefatti reali, rigenerati tramite ri-proiezione: non modificarle mai a mano.

## Utilizzo

| Comando | Cosa fa |
|---------|---------|
| `/global-plugins:generate <briefing>` | Genera un plugin multi-provider a partire da una descrizione. |
| `/global-plugins:adapt <path>` | Adatta a tutti i provider un plugin progettato per un singolo provider. |
| `/global-plugins:audit <path>` | Audit approfondito e in sola lettura di un plugin. |
| `/global-plugins:validate <path>` | Gate di validazione rapido con esito pass/fail. |
| `/global-plugins:harness-lens <idea>` | Esplora come verrebbe composta un'idea di plugin. |

I plugin generati forniscono inoltre `/<plugin>:evolve` e `/<plugin>:migrate` per l'auto-evoluzione.

## Architettura interna

Sorgente canonica → **resolver** (registro dei provider + manifest a 3 livelli: profili → moduli → componenti) → moduli di **proiezione** per provider → **executor** di proiezione. Una lente di progettazione composizionale modella l'harness di un plugin a partire da una richiesta in linguaggio naturale. La governance (sincronizzazione SemVer, changelog, parità, difesa dei prompt, conformità) è integrata nel motore.

## Licenza

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
