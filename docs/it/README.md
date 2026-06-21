<div align="center">

**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | Italiano

# Global Plugins

![Global Plugins](../../assets/hero.png)

Un’unica fonte canonica, ogni provider. Genera, adatta ed evolvi plugin di IA per la programmazione da una singola descrizione.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-0.7.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | Italiano

</div>

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

| Provider | Ambito | Cartella nel repo | Si installa in | Trasformazione rilevante | Build |
|----------|--------|-------------------|----------------|--------------------------|-------|
| claude | home | `.claude` | marketplace / `~/.claude` | copia; merge MCP | — |
| codex | home | `.codex` | `~/.codex` | agenti in TOML; indice `AGENTS.md` + file fratelli skill/comandi + `config.toml` | — |
| opencode | home | `.opencode` | `~/.config/opencode` | copia; plugin compilato sotto `dist/` | sì |

**Ambito:** tutti e tre sono provider *home* (CLI) — ciascuno mantiene una configurazione globale per utente. La **Cartella nel repo** è il nome della dotfolder in questo repository (la sorgente della proiezione); **Si installa in** è il punto in cui la collochi affinché quel provider la legga.

Il registro è aperto. È possibile aggiungere nuovi provider estendendo il registro con una voce reale, un contratto di provider, un modulo adapter e un test.

## Installazione

La dotfolder versionata di ciascun provider è un artefatto reale e pronto all'uso, rigenerato tramite ri-proiezione: non modificarla mai a mano. Scegli il tuo provider qui sotto.

### Claude Code

Claude Code si installa da un marketplace di plugin — non serve clonare:

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

I comandi `/plugin` sono solo per Claude Code.

### Codex

Codex non ha un'installazione da marketplace per questo plugin, quindi clona il repo e copia la sua cartella `.codex` nella directory di configurazione globale di Codex:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
mkdir -p ~/.codex
cp -R .codex/. ~/.codex/
```

Codex legge `~/.codex/`: rileva automaticamente `~/.codex/config.toml`, l'indice `AGENTS.md`, i ruoli `[agents.<name>]` e i file fratelli `skills/`/`commands/` la prossima volta che esegui `codex`.

### opencode

opencode non ha un'installazione da marketplace per questo plugin, quindi clona il repo, compila il plugin, poi copia la sua cartella `.opencode` nella directory di configurazione globale di opencode:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
node engine/build-opencode.js          # compila il plugin (produce .opencode/dist/)
mkdir -p ~/.config/opencode
cp -R .opencode/. ~/.config/opencode/
```

opencode legge la sua configurazione globale da `~/.config/opencode/` (non `~/.opencode/`). Il passaggio di build è necessario prima dell'uso; produce `.opencode/dist/`.

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

**Genera da qualsiasi provider — non solo da Claude Code.** Il motore di proiezione viaggia con ogni installazione come runtime payload, così un plugin installato può esso stesso creare/adattare/evolvere plugin figli multi-provider dalle tre CLI. Claude Code lo porta tramite l'installazione dell'intero repository; **Codex** e **opencode** lo portano sotto una sottocartella riservata `_engine/` (`~/.codex/_engine/`, `~/.config/opencode/_engine/`). Su Codex l'agente esegue il motore incluso con Node (`cd ~/.codex/_engine && node scripts/evolve/project.mjs`, con un'approvazione per esecuzione); su opencode il plugin compilato in `dist/` espone strumenti nativi `generate`/`adapt`/`evolve`/`validate`/`migrate` supportati dallo stesso payload. Anche ogni figlio generato porta con sé il motore, quindi è autosufficiente e riproiettabile da solo.

## Architettura interna

Sorgente canonica → **resolver** (registro dei provider + manifest a 3 livelli: profili → moduli → componenti) → moduli di **proiezione** per provider → **executor** di proiezione. Una lente di progettazione composizionale modella l'harness di un plugin a partire da una richiesta in linguaggio naturale. La governance (sincronizzazione SemVer, changelog, parità, difesa dei prompt, conformità) è integrata nel motore.

## Licenza

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
