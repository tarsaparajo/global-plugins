**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | 简体中文 | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | 简体中文 | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

---

## 概述

**Global Plugins** 用于构建和维护跨多家服务商的 AI 编程插件。你只需在一份与服务商无关的**规范源（canonical source）**中编写一次插件；一个确定性引擎会将其**投影（project）**为每个受支持服务商的原生格式。这些投影产物会被纳入版本管理——绝不手工编辑，始终从规范源重新生成。最终效果是：单一事实来源，多家服务商，完美同步。

无论是谁，只要想让一个插件在任何地方都能用、而不必为每个工具维护一份独立副本，它都能派上用场——用通俗的语言描述即可，无需深厚的技术功底。

## 能力

### GENERATE（生成）

用自然语言描述一个插件，Global Plugins 便会设计出它的完整架构——技能、智能体、钩子、命令、权限——并将其投影到每一个选定的服务商，且内建自我演进能力。

### ADAPT（适配）

指向一个为单一服务商构建的插件，Global Plugins 会将其提升为规范形态，并投影到所有服务商，100% 保留其原有功能。

### EVOLVE（演进）

它生成的每个插件都自带专属的演进引擎：只需修改一次规范源，改动便会镜像到每一个服务商——并附带一致性校验、版本号递增、变更日志与账本条目，以及面向已安装副本的条件式迁移。任何写入之前，仅需一次确认。

## 服务商矩阵

| 服务商 | 范围 | 根目录 | 关键转换 | 需构建 |
|----------|-------|------|-------------------|-------|
| claude | home | `.claude` | 复制；MCP 合并 | — |
| claude (project) | project | `.claude` | 复制；MCP 合并 | — |
| codex | home | `.codex` | 智能体转 TOML；`AGENTS.md` + `config.toml` | — |
| opencode | home | `.opencode` | 复制；编译后的插件置于 `dist/` 下 | 是 |
| cursor | project | `.cursor` | 规则转 `.mdc`；MCP 合并 | — |
| kiro | project | `.kiro` | 智能体以 `.md` + `.json` 形式；MCP 合并 | — |
| gemini | project | `.gemini` | 单文件 `GEMINI.md` | — |
| qwen | home | `.qwen` | 单文件 `QWEN.md` | — |
| zed | project | `.zed` | 规则平铺；`settings.json` 合并 | — |
| codebuddy | project | `.codebuddy` | 规则平铺；安装脚本 | — |
| joycode | project | `.joycode` | 规则平铺；安装脚本 | — |
| antigravity | project | `.agent` | 将命令/智能体重映射为工作流/技能 | — |
| trae | project | `.trae` | 规则平铺；安装脚本 | — |
| vscode | project | `.github` | 合并为 `copilot-instructions.md` + `.vscode/settings.json` | — |

**范围：** *home* 类服务商保留一份全局的、按用户区分的配置（命令行工具）；*project* 类服务商将配置保留在仓库内部（IDE/编辑器）。

注册表是开放的。要新增服务商，只需在注册表中扩展一个真实条目、一份服务商契约、一个适配器模块以及一个测试。

## 安装

可从插件市场安装，也可手动将本目录复制到你的插件位置。已纳入版本管理的各服务商点目录（dotfolder）都是真实产物，由重新投影自动生成——切勿手工编辑。

## 用法

| 命令 | 作用 |
|---------|--------------|
| `/global-plugins:generate <briefing>` | 根据描述生成一个跨多家服务商的插件。 |
| `/global-plugins:adapt <path>` | 将单一服务商的插件适配到所有服务商。 |
| `/global-plugins:audit <path>` | 对插件进行深入、只读的审计。 |
| `/global-plugins:validate <path>` | 快速的通过/不通过校验关卡。 |
| `/global-plugins:harness-lens <idea>` | 探索某个插件构想会如何被组合而成。 |

生成的插件还额外附带 `/<plugin>:evolve` 与 `/<plugin>:migrate`，用于自我演进。

## 内部架构

规范源 → **解析器（resolver）**（服务商注册表 + 三层清单：profiles → modules → components）→ 各服务商的**投影（projection）**模块 → 投影**执行器（executor）**。一套组合式的设计视角，会从一段自然语言请求出发塑造插件的运行框架（harness）。治理机制（SemVer 同步、变更日志、一致性、提示词防御、合规）已内建于引擎之中。

## 许可证

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
