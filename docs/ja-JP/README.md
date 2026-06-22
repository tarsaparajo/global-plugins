<div align="center">

**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | 日本語 | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

ひとつの正規ソースで、あらゆるプロバイダーへ。ひとつの説明から AI コーディングプラグインを生成・適応・進化させます。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | 日本語 | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

</div>

---

## 概要

**Global Plugins** は、マルチプロバイダー対応の AI コーディングプラグインを構築・保守するためのツールです。プラグインはプロバイダーに依存しない **正規ソース (canonical source)** として一度だけ記述すれば、決定論的なエンジンがそれを各サポート対象プロバイダーのネイティブ形式へと **投影 (project)** します。投影結果はコミット済みの成果物 (artifact) であり、手作業で編集することはなく、常に正規ソースから再生成されます。その結果として、唯一の真実 (one truth) から多数のプロバイダーへ、完全に同期した状態が得られます。

ツールごとに別々のコピーを保守することなく、プラグインをどこでも動作させたいすべての人に向けたツールです。平易な言葉で記述でき、高度な技術知識は必要ありません。

## 機能

### GENERATE（生成）

プラグインを自然言語で記述すると、Global Plugins がそのアーキテクチャ全体（スキル、エージェント、フック、コマンド、権限）を設計し、選択したすべてのプロバイダーへ投影します。自己進化機能も組み込まれています。

### ADAPT（適応）

単一プロバイダー向けに構築されたプラグインを指定すると、Global Plugins がそれを正規形式へと引き上げ、元の機能を 100% 保持したまますべてのプロバイダーへ投影します。

### EVOLVE（進化）

生成されるすべてのプラグインには、それ自身の進化エンジンが付属します。正規ソースを一度編集すれば、その変更がすべてのプロバイダーへ反映されます。あわせて、整合性 (parity) の検証、バージョンの繰り上げ、変更履歴 (changelog) と台帳 (ledger) への記録、そしてインストール済みのコピーに対する条件付きマイグレーションが行われます。書き込みの前には一度だけ確認が求められます。

## プロバイダーマトリクス

| プロバイダー | スコープ | リポジトリのフォルダ | インストール先 | 主な変換 | ビルド |
|----------|-------|-------------|-------------|-------------------|-------|
| claude | home | `.claude` | マーケットプレイス / `~/.claude` | コピー、MCP マージ | — |
| codex | home | `.codex` | `~/.codex` | エージェントを TOML 化、`AGENTS.md` インデックス + skills／commands の同階層ファイル + `config.toml` | — |
| opencode | home | `.opencode` | `~/.config/opencode` | コピー、`dist/` 配下にコンパイル済みプラグイン | あり |

**スコープ:** 3 つすべてが *home* プロバイダー（CLI）です。それぞれがユーザーごとのグローバル設定を保持します。**リポジトリのフォルダ** はこのリポジトリ内のドットフォルダ名（投影元）であり、**インストール先** はそのプロバイダーが読み取れるように配置する場所です。

レジストリは拡張可能です。実エントリ、プロバイダー契約 (provider contract)、アダプターモジュール、テストを追加してレジストリを拡張すれば、新しいプロバイダーを追加できます。

## インストール

各プロバイダーのコミット済みドットフォルダは、再投影によって再生成される、実際にすぐ使える成果物です。手作業で編集しないでください。以下からお使いのプロバイダーを選択してください。

### Claude Code

Claude Code はプラグインマーケットプレイスからインストールします。クローンは不要です。

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

`/plugin` コマンドは Claude Code 専用です。

### Codex

Codex にはこのプラグイン用のマーケットプレイスインストールがないため、リポジトリをクローンし、その `.codex` フォルダを Codex のグローバル設定ディレクトリへコピーします。

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
mkdir -p ~/.codex
cp -R .codex/. ~/.codex/
```

Codex は `~/.codex/` を読み取ります。次に `codex` を実行したときに、`~/.codex/config.toml`、`AGENTS.md` インデックス、`[agents.<name>]` のロール、そして skills／commands の同階層ファイルを自動検出します。

### opencode

opencode にはこのプラグイン用のマーケットプレイスインストールがないため、リポジトリをクローンし、コンパイル済みプラグインをビルドしてから、その `.opencode` フォルダを opencode のグローバル設定ディレクトリへコピーします。

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
node engine/build-opencode.js          # build the compiled plugin (produces .opencode/dist/)
mkdir -p ~/.config/opencode
cp -R .opencode/. ~/.config/opencode/
```

opencode はグローバル設定を `~/.config/opencode/`（`~/.opencode/` ではありません）から読み取ります。使用前にビルド手順が必須であり、これにより `.opencode/dist/` が生成されます。

各プロバイダーが適用する正確な変換については、[プロバイダーマトリクス](#provider-matrix)を参照してください。

## 使い方

| コマンド | 動作 |
|---------|--------------|
| `/global-plugins:generate <briefing>` | 説明文からマルチプロバイダー対応プラグインを生成します。 |
| `/global-plugins:adapt <path>` | 単一プロバイダー向けプラグインをすべてのプロバイダーへ適応させます。 |
| `/global-plugins:audit <path>` | プラグインを深く読み取り専用で監査します。 |
| `/global-plugins:validate <path>` | 高速な合否判定ゲートで検証します。 |
| `/global-plugins:harness-lens <idea>` | プラグインのアイデアがどのように構成されるかを探索します。 |
| `/global-plugins:evolve <change>` | 正規ソースの変更をすべてのプロバイダーへ反映し、整合性の検証、バージョンの繰り上げ、変更履歴、条件付きマイグレーションを行います。 |
| `/global-plugins:migrate [--dry-run \| --apply \| --rollback]` | 保留中のマイグレーションチェーンを、すでにインストール済みのコピーへ適用します。 |

Global Plugins は自己ホスト型です。それ自身の進化 (evolve) とマイグレーション (migrate) のインターフェースを備えるとともに、生成するすべてのプラグインに同じ `/<plugin>:evolve` と `/<plugin>:migrate` を反映します。

**どのプロバイダーからでも生成できます — Claude Code だけではありません。** 投影エンジンは runtime payload としてすべてのインストールに同梱されるため、インストール済みのプラグイン自身が 3 つの CLI すべてからマルチプロバイダーの子プラグインを作成・適応・進化させられます。Claude Code はリポジトリ全体のインストールでこれを携行し、**Codex** と **opencode** は予約済みのサブディレクトリ `engine/`（`~/.codex/engine/`、`~/.config/opencode/engine/`）に携行します。Codex ではエージェントが Node でバンドル済みエンジンを実行します（`cd ~/.codex/engine && node scripts/evolve/project.mjs`、実行ごとに 1 回の承認）。opencode では `dist/` のコンパイル済みプラグインが、同じ payload に支えられたネイティブツール `generate`/`adapt`/`evolve`/`validate`/`migrate` を公開します。生成された子もエンジンを携行するため、自己完結し、単独で再投影できます。

## 内部アーキテクチャ

正規ソース → **リゾルバ (resolver)**（プロバイダーレジストリ + 3 層マニフェスト: プロファイル → モジュール → コンポーネント）→ プロバイダーごとの **投影 (projection)** モジュール → 投影 **エグゼキュータ (executor)**。コンポジショナルな設計レンズが、自然言語のリクエストからプラグインのハーネスを形作ります。ガバナンス（SemVer の同期、変更履歴、整合性、プロンプト防御、コンプライアンス）はエンジンに組み込まれています。

## ライセンス

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
