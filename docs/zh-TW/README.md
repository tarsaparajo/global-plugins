<div align="center">

**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | 繁體中文 | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

單一規範源，涵蓋所有服務商。只需一句描述，即可生成、適配並演進 AI 編程外掛。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | 繁體中文 | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

</div>

---

## 概觀

**Global Plugins** 用於建構與維護跨供應商的 AI coding 外掛。你只需以與供應商無關的**標準來源（canonical source）**撰寫一次外掛，確定性引擎便會將其**投影（project）**為每個受支援供應商的原生格式。這些投影產物會被納入版本控制——絕不手動編輯，永遠由標準來源重新產生。最終成果是：單一真相、眾多供應商、完美同步。

它適合任何想讓外掛在各處都能運作、卻不想為每個工具維護一份獨立副本的人——以淺白的語言描述即可，無需深厚的技術知識。

## 能力

### GENERATE（產生）

以自然語言描述一個外掛，Global Plugins 便會設計其完整架構——skills、agents、hooks、commands、permissions——並投影到每個選定的供應商，且內建自我演進機制。

### ADAPT（轉接）

指向一個僅為單一供應商打造的外掛，Global Plugins 會將它提升為標準形式，並投影到所有供應商，同時 100% 保留其原始功能。

### EVOLVE（演進）

它產出的每個外掛都隨附自己的演進引擎：只需編輯一次標準來源，變更便會鏡射到每個供應商——並附帶對等性驗證、版本號遞增、changelog 與 ledger 紀錄，以及針對已安裝副本的條件式遷移。任何寫入動作前都只需一次確認。

## 供應商對照表

| 供應商 | 範圍 | 儲存庫資料夾 | 安裝至 | 主要轉換 | 需建置 |
|----------|-------|-------------|-------------|-------------------|-------|
| claude | home | `.claude` | marketplace / `~/.claude` | 複製；MCP 合併 | — |
| codex | home | `.codex` | `~/.codex` | agents 轉為 TOML；`AGENTS.md` 索引 + skills/commands 並列檔案 + `config.toml` | — |
| opencode | home | `.opencode` | `~/.config/opencode` | 複製；編譯後的外掛置於 `dist/` 下 | 是 |

**範圍：** 三者皆為 *home* 供應商（CLI）——每個都會保有全域、以使用者為單位的設定。**儲存庫資料夾**是本儲存庫中的 dotfolder 名稱（投影來源）；**安裝至**則是你為了讓該供應商讀取而放置它的位置。

此登錄表是開放的。只要為登錄表擴充一筆真實項目、一份供應商合約、一個轉接模組與一項測試，即可加入新的供應商。

## 安裝

每個供應商已納入版本控制的 dotfolder 都是真實、可直接使用的產物，會透過重新投影重新產生——切勿手動編輯它們。請在下方選擇你的供應商。

### Claude Code

Claude Code 從外掛 marketplace 安裝——無需 clone：

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

`/plugin` 指令僅適用於 Claude Code。

### Codex

此外掛在 Codex 沒有 marketplace 安裝方式，因此請 clone 儲存庫並將其 `.codex` 資料夾複製到 Codex 的全域設定目錄：

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
mkdir -p ~/.codex
cp -R .codex/. ~/.codex/
```

Codex 會讀取 `~/.codex/`：下次你執行 `codex` 時，它會自動偵測 `~/.codex/config.toml`、`AGENTS.md` 索引、`[agents.<name>]` 角色，以及並列的 `skills/`／`commands/` 檔案。

### opencode

此外掛在 opencode 沒有 marketplace 安裝方式，因此請 clone 儲存庫、建置編譯後的外掛，然後將其 `.opencode` 資料夾複製到 opencode 的全域設定目錄：

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
node engine/build-opencode.js          # build the compiled plugin (produces .opencode/dist/)
mkdir -p ~/.config/opencode
cp -R .opencode/. ~/.config/opencode/
```

opencode 會從 `~/.config/opencode/`（而非 `~/.opencode/`）讀取其全域設定。建置步驟為使用前的必要條件；它會產生 `.opencode/dist/`。

請參閱[供應商對照表](#provider-matrix)以了解每個供應商套用的確切轉換。

## 使用方式

| 指令 | 作用 |
|---------|--------------|
| `/global-plugins:generate <briefing>` | 從一段描述產生跨供應商外掛。 |
| `/global-plugins:adapt <path>` | 將單一供應商的外掛轉接到所有供應商。 |
| `/global-plugins:audit <path>` | 對外掛進行深入、唯讀的稽核。 |
| `/global-plugins:validate <path>` | 快速的通過／失敗驗證關卡。 |
| `/global-plugins:harness-lens <idea>` | 探索某個外掛構想會如何被組構而成。 |
| `/global-plugins:evolve <change>` | 將一項標準變更鏡射到每個供應商，並附帶對等性、版本號遞增、changelog 與條件式遷移。 |
| `/global-plugins:migrate [--dry-run \| --apply \| --rollback]` | 對已安裝的副本套用待處理的遷移鏈。 |

Global Plugins 具有自我承載（self-hosting）能力：它隨附自己的 evolve 與 migrate 介面，並將相同的 `/<plugin>:evolve` 與 `/<plugin>:migrate` 鏡射到它所產生的每個外掛中。

**可從任何供應商生成 — 不僅限於 Claude Code。** 投影引擎會以 runtime payload 的形式隨每次安裝一併攜帶，因此已安裝的外掛本身就能從三種 CLI 建立／調適／演進多供應商的子外掛。Claude Code 透過整個儲存庫的安裝攜帶它；**Codex** 與 **opencode** 則將其置於保留的子目錄 `_engine/`（`~/.codex/_engine/`、`~/.config/opencode/_engine/`）中攜帶。在 Codex 上，代理會以 Node 執行打包後的引擎（`cd ~/.codex/_engine && node scripts/evolve/project.mjs`，每次執行需一次核准）；在 opencode 上，`dist/` 中編譯後的外掛會公開由同一 payload 支援的原生工具 `generate`/`adapt`/`evolve`/`validate`/`migrate`。每個生成的子外掛也都攜帶引擎，因此能自給自足，並可獨立地重新投影。

## 內部架構

標準來源 → **解析器（resolver）**（供應商登錄表 + 三層 manifest：profiles → modules → components）→ 各供應商的**投影**模組 → 投影**執行器（executor）**。一套組合式的設計視角會依據自然語言請求形塑外掛的 harness。治理機制（SemVer 同步、changelog、對等性、prompt 防禦、合規）皆已內建於引擎中。

## 授權

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
