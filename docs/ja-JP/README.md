**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | 日本語 | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

ひとつの正規ソースで、あらゆるプロバイダーへ。ひとつの説明から AI コーディングプラグインを生成・適応・進化させます。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | 日本語 | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

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

| プロバイダー | スコープ | ルート | 主な変換 | ビルド |
|----------|-------|------|-------------------|-------|
| claude | home | `.claude` | コピー、MCP マージ | — |
| claude (project) | project | `.claude` | コピー、MCP マージ | — |
| codex | home | `.codex` | エージェントを TOML 化、`AGENTS.md` + `config.toml` | — |
| opencode | home | `.opencode` | コピー、`dist/` 配下にコンパイル済みプラグイン | あり |
| cursor | project | `.cursor` | ルールを `.mdc` 化、MCP マージ | — |
| kiro | project | `.kiro` | エージェントを `.md` + `.json` 化、MCP マージ | — |
| gemini | project | `.gemini` | 単一ファイル `GEMINI.md` | — |
| qwen | home | `.qwen` | 単一ファイル `QWEN.md` | — |
| zed | project | `.zed` | ルールをフラット化、`settings.json` マージ | — |
| codebuddy | project | `.codebuddy` | ルールをフラット化、インストールスクリプト | — |
| joycode | project | `.joycode` | ルールをフラット化、インストールスクリプト | — |
| antigravity | project | `.agent` | コマンド／エージェントをワークフロー／スキルへ再マッピング | — |
| trae | project | `.trae` | ルールをフラット化、インストールスクリプト | — |
| vscode | project | `.github` | 統合された `copilot-instructions.md` + `.vscode/settings.json` | — |

**スコープ:** *home* プロバイダーはユーザーごとのグローバル設定（CLI）を保持し、*project* プロバイダーは設定をリポジトリ内（IDE／エディタ）に保持します。

レジストリは拡張可能です。実エントリ、プロバイダー契約 (provider contract)、アダプターモジュール、テストを追加してレジストリを拡張すれば、新しいプロバイダーを追加できます。

## インストール

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

または、このディレクトリをプラグイン格納場所へコピーして手動でインストールすることもできます。コミット済みのプロバイダー用ドットフォルダは実際の成果物であり、再投影によって再生成されます。手作業で編集しないでください。

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

## 内部アーキテクチャ

正規ソース → **リゾルバ (resolver)**（プロバイダーレジストリ + 3 層マニフェスト: プロファイル → モジュール → コンポーネント）→ プロバイダーごとの **投影 (projection)** モジュール → 投影 **エグゼキュータ (executor)**。コンポジショナルな設計レンズが、自然言語のリクエストからプラグインのハーネスを形作ります。ガバナンス（SemVer の同期、変更履歴、整合性、プロンプト防御、コンプライアンス）はエンジンに組み込まれています。

## ライセンス

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
