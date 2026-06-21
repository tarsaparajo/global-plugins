<div align="center">

**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | Français | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

Une seule source canonique, tous les fournisseurs. Générez, adaptez et faites évoluer des plugins de codage IA à partir d’une seule description.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-0.10.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | Français | [Italiano](../it/README.md)

</div>

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

| Fournisseur | Portée | Dossier du dépôt | S'installe vers | Transformation notable | Build |
|----------|-------|-------------|-------------|-------------------|-------|
| claude | poste utilisateur | `.claude` | marketplace / `~/.claude` | copie ; fusion MCP | — |
| codex | poste utilisateur | `.codex` | `~/.codex` | agents en TOML ; index `AGENTS.md` + fichiers frères skills/commands + `config.toml` | — |
| opencode | poste utilisateur | `.opencode` | `~/.config/opencode` | copie ; plugin compilé sous `dist/` | oui |

**Portée :** les trois sont des fournisseurs de type *poste utilisateur* (CLI) — chacun conserve une configuration globale par utilisateur. **Dossier du dépôt** est le nom du dotfolder dans ce dépôt (la source de projection) ; **S'installe vers** est l'emplacement où vous le placez pour que ce fournisseur puisse le lire.

Le registre est ouvert. De nouveaux fournisseurs peuvent être ajoutés en étendant le registre avec une entrée réelle, un contrat de fournisseur, un module d'adaptateur et un test.

## Installation

Le dossier de configuration (dotfolder) versionné de chaque fournisseur est un artefact réel, prêt à l'emploi, régénéré par re-projection — ne le modifiez jamais à la main. Choisissez votre fournisseur ci-dessous.

### Claude Code

Claude Code s'installe depuis une marketplace de plugins — aucun clonage nécessaire :

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

Les commandes `/plugin` sont propres à Claude Code.

### Codex

Codex ne dispose d'aucune installation par marketplace pour ce plugin ; clonez donc le dépôt et copiez son dossier `.codex` dans le répertoire de configuration globale de Codex :

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
mkdir -p ~/.codex
cp -R .codex/. ~/.codex/
```

Codex lit `~/.codex/` : il détecte automatiquement `~/.codex/config.toml`, l'index `AGENTS.md`, les rôles `[agents.<name>]` et les fichiers frères `skills/`/`commands/` lors de votre prochaine exécution de `codex`.

### opencode

opencode ne dispose d'aucune installation par marketplace pour ce plugin ; clonez donc le dépôt, construisez le plugin compilé, puis copiez son dossier `.opencode` dans le répertoire de configuration globale d'opencode :

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
node engine/build-opencode.js          # build the compiled plugin (produces .opencode/dist/)
mkdir -p ~/.config/opencode
cp -R .opencode/. ~/.config/opencode/
```

opencode lit sa configuration globale depuis `~/.config/opencode/` (et non `~/.opencode/`). L'étape de build est requise avant utilisation ; elle produit `.opencode/dist/`.

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

**Générez depuis n'importe quel fournisseur — pas seulement Claude Code.** Le moteur de projection voyage avec chaque installation sous forme de runtime payload, de sorte qu'un plugin installé peut lui-même créer/adapter/faire évoluer des plugins enfants multi-fournisseurs depuis les trois CLI. Claude Code l'embarque via l'installation du dépôt entier ; **Codex** et **opencode** l'embarquent sous un sous-dossier réservé `_engine/` (`~/.codex/_engine/`, `~/.config/opencode/_engine/`). Sur Codex, l'agent exécute le moteur embarqué avec Node (`cd ~/.codex/_engine && node scripts/evolve/project.mjs`, avec une approbation par exécution) ; sur opencode, le plugin compilé dans `dist/` expose des outils natifs `generate`/`adapt`/`evolve`/`validate`/`migrate` adossés au même payload. Chaque enfant généré embarque aussi le moteur, il est donc autosuffisant et reprojetable par lui-même.

## Architecture interne

Source canonique → **résolveur** (registre des fournisseurs + manifestes à 3 niveaux : profils → modules → composants) → modules de **projection** par fournisseur → **exécuteur** de projection. Une lentille de conception compositionnelle façonne le harness d'un plugin à partir d'une requête en langage naturel. La gouvernance (synchronisation SemVer, changelog, parité, défense des prompts, conformité) est intégrée au moteur.

## Licence

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
