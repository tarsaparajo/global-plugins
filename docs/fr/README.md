**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | Français | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

Une seule source canonique, tous les fournisseurs. Générez, adaptez et faites évoluer des plugins de codage IA à partir d’une seule description.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | Français | [Italiano](../it/README.md)

---

## Vue d'ensemble

**Global Plugins** crée et maintient des plugins d'IA pour l'assistance au code, compatibles avec plusieurs fournisseurs. Vous écrivez un plugin une seule fois dans une **source canonique** indépendante de tout fournisseur ; un moteur déterministe la **projette** vers le format natif de chaque fournisseur pris en charge. Ces projections sont des artefacts versionnés — jamais modifiés à la main, toujours régénérés depuis la source canonique. Le résultat : une seule vérité, plusieurs fournisseurs, en synchronisation parfaite.

C'est l'outil idéal pour quiconque souhaite qu'un plugin fonctionne partout sans avoir à maintenir une copie distincte par outil — le tout décrit en langage clair, sans exiger de connaissances techniques poussées.

## Fonctionnalités

### GENERATE (générer)

Décrivez un plugin en langage naturel et Global Plugins en conçoit l'architecture complète — skills, agents, hooks, commandes, permissions — puis le projette vers chaque fournisseur sélectionné, avec l'auto-évolution intégrée d'emblée.

### ADAPT (adapter)

Pointez vers un plugin conçu pour un seul fournisseur et Global Plugins l'élève à sa forme canonique puis le projette vers tous les fournisseurs, en préservant 100 % de ses fonctionnalités d'origine.

### EVOLVE (faire évoluer)

Chaque plugin produit est livré avec son propre moteur d'évolution : modifiez la source canonique une seule fois, et le changement est répercuté sur chaque fournisseur — avec validation de la parité, incrément de version, entrée au changelog et au registre, ainsi qu'une migration conditionnelle pour les copies déjà installées. Une seule confirmation avant la moindre écriture.

## Matrice des fournisseurs

| Fournisseur | Portée | Racine | Transformation notable | Build |
|----------|-------|------|-------------------|-------|
| claude | poste utilisateur | `.claude` | copie ; fusion MCP | — |
| claude (projet) | projet | `.claude` | copie ; fusion MCP | — |
| codex | poste utilisateur | `.codex` | agents en TOML ; `AGENTS.md` + `config.toml` | — |
| opencode | poste utilisateur | `.opencode` | copie ; plugin compilé sous `dist/` | oui |
| cursor | projet | `.cursor` | règles en `.mdc` ; fusion MCP | — |
| kiro | projet | `.kiro` | agents en `.md` + `.json` ; fusion MCP | — |
| gemini | projet | `.gemini` | fichier unique `GEMINI.md` | — |
| qwen | poste utilisateur | `.qwen` | fichier unique `QWEN.md` | — |
| zed | projet | `.zed` | règles à plat ; fusion `settings.json` | — |
| codebuddy | projet | `.codebuddy` | règles à plat ; script d'installation | — |
| joycode | projet | `.joycode` | règles à plat ; script d'installation | — |
| antigravity | projet | `.agent` | remappe commandes/agents vers workflows/skills | — |
| trae | projet | `.trae` | règles à plat ; script d'installation | — |
| vscode | projet | `.github` | `copilot-instructions.md` consolidé + `.vscode/settings.json` | — |

**Portée :** les fournisseurs de type *poste utilisateur* conservent une configuration globale par utilisateur (une CLI) ; les fournisseurs de type *projet* conservent leur configuration au sein du dépôt (un IDE/éditeur).

Le registre est ouvert. De nouveaux fournisseurs peuvent être ajoutés en étendant le registre avec une entrée réelle, un contrat de fournisseur, un module d'adaptateur et un test.

## Installation

Le dossier de configuration (dotfolder) versionné de chaque fournisseur est un artefact réel, prêt à l'emploi, régénéré par re-projection — ne le modifiez jamais à la main. Les fournisseurs *poste utilisateur* (CLI) s'installent dans votre répertoire personnel (`~/`) ; les fournisseurs *projet* (IDE/éditeurs) s'installent à la racine du dépôt. Choisissez votre fournisseur ci-dessous.

### Claude Code

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

Ou bien copiez `.claude` dans `~/.claude` (global) ou `<repo>/.claude` (par projet). Les commandes `/plugin` sont propres à Claude Code.

### Codex

```
cp -r .codex ~/.codex
```

Configuration globale de la CLI. `AGENTS.md` + `config.toml` et `.codex/agents/*.toml` sont détectés automatiquement lorsque vous lancez `codex` dans le projet.

### opencode

```
node engine/build-opencode.js   # construire d'abord le plugin compilé
cp -r .opencode ~/.opencode
```

Configuration globale de la CLI. L'étape de build produit `.opencode/dist/` et est requise avant utilisation.

### Qwen

```
cp -r .qwen ~/.qwen
```

Configuration globale de la CLI. Tout le contexte d'instructions tient dans le fichier unique `QWEN.md`.

### Cursor

```
cp -r .cursor <repo>/.cursor
```

Configuration projet de l'IDE. Cursor charge automatiquement `.cursor/rules/*.mdc`, `.cursor/agents/`, et fusionne `.cursor/mcp.json`.

### Gemini

```
cp -r .gemini <repo>/.gemini
```

Configuration projet. Fournisseur à fichier unique — tout le contexte est consolidé dans `.gemini/GEMINI.md`.

### Kiro

```
cp -r .kiro <repo>/.kiro
```

Configuration projet de l'IDE. Les agents sont livrés en `.md` + `.json` ; `.kiro/mcp.json` est fusionné.

### Zed

```
cp -r .zed <repo>/.zed
```

Configuration projet de l'éditeur. Les règles sont mises à plat ; `.zed/settings.json` est fusionné.

### VS Code (GitHub Copilot)

```
cp -r .github <repo>/.github   # copilot-instructions.md consolidé
cp -r .vscode <repo>/.vscode   # settings.json
```

Configuration projet. Tout le contexte d'instructions est consolidé dans `.github/copilot-instructions.md`.

### Antigravity

```
cp -r .agent <repo>/.agent
```

Configuration projet de l'IDE. Les commandes/agents sont remappés vers les workflows et skills d'Antigravity.

### CodeBuddy

```
cp -r .codebuddy <repo>/.codebuddy
```

Configuration projet. Commandes, agents, skills et règles mises à plat ; livré avec un script d'installation.

### JoyCode

```
cp -r .joycode <repo>/.joycode
```

Configuration projet. Commandes, agents, skills et règles mises à plat ; livré avec un script d'installation.

### Trae

```
cp -r .trae <repo>/.trae
```

Configuration projet de l'IDE. Commandes, agents, skills et règles mises à plat ; livré avec un script d'installation.

Consultez la [Matrice des fournisseurs](#provider-matrix) pour connaître la transformation exacte qu'applique chaque fournisseur.

## Utilisation

| Commande | Ce qu'elle fait |
|---------|--------------|
| `/global-plugins:generate <briefing>` | Génère un plugin multi-fournisseurs à partir d'une description. |
| `/global-plugins:adapt <path>` | Adapte un plugin mono-fournisseur à tous les fournisseurs. |
| `/global-plugins:audit <path>` | Audit approfondi d'un plugin, en lecture seule. |
| `/global-plugins:validate <path>` | Contrôle rapide de validation réussite/échec. |
| `/global-plugins:harness-lens <idea>` | Explore la façon dont une idée de plugin serait composée. |
| `/global-plugins:evolve <change>` | Répercute un changement canonique sur chaque fournisseur, avec la parité, un incrément de version, un changelog et une migration conditionnelle. |
| `/global-plugins:migrate [--dry-run \| --apply \| --rollback]` | Applique la chaîne de migration en attente à une copie déjà installée. |

Global Plugins est auto-hébergé : il est livré avec sa propre surface evolve et migrate, et répercute les mêmes `/<plugin>:evolve` et `/<plugin>:migrate` dans chaque plugin qu'il génère.

## Architecture interne

Source canonique → **résolveur** (registre des fournisseurs + manifestes à 3 niveaux : profils → modules → composants) → modules de **projection** par fournisseur → **exécuteur** de projection. Une lentille de conception compositionnelle façonne le harness d'un plugin à partir d'une requête en langage naturel. La gouvernance (synchronisation SemVer, changelog, parité, défense des prompts, conformité) est intégrée au moteur.

## Licence

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
