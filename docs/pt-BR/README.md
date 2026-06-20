**Language:** [English](../../README.md) | Português (Brasil) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

Uma fonte canônica, todos os provedores. Gere, adapte e evolua plugins de IA para programação a partir de uma única descrição.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | Português (Brasil) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

---

## Visão geral

O **Global Plugins** cria e mantém plugins de IA para programação compatíveis com múltiplos provedores. Você escreve um plugin uma única vez em uma **fonte canônica** neutra em relação ao provedor; um motor determinístico o **projeta** para o formato nativo de cada provedor suportado. As projeções são artefatos versionados — nunca editados à mão, sempre regenerados a partir da fonte canônica. O resultado: uma única verdade, vários provedores, perfeitamente sincronizados.

Ele serve para qualquer pessoa que queira um plugin funcionando em todos os lugares sem manter uma cópia separada por ferramenta — descrito em linguagem simples, sem exigir conhecimento técnico aprofundado.

## Recursos

### GENERATE (gerar)

Descreva um plugin em linguagem natural e o Global Plugins projeta toda a sua arquitetura — skills, agents, hooks, comandos, permissões — e o projeta para cada provedor selecionado, já com autoevolução embutida.

### ADAPT (adaptar)

Aponte para um plugin criado para um único provedor e o Global Plugins o eleva à forma canônica e o projeta para todos os provedores, preservando 100% da funcionalidade original.

### EVOLVE (evoluir)

Todo plugin que ele produz vem com seu próprio motor de evolução: edite a fonte canônica uma única vez e a mudança é espelhada para cada provedor — com validação de paridade, incremento de versão, entrada no changelog e no ledger, e uma migração condicional para as cópias já instaladas. Uma única confirmação antes de qualquer escrita.

## Matriz de provedores

| Provedor | Escopo | Raiz | Transformação notável | Build |
|----------|--------|------|-----------------------|-------|
| claude | home | `.claude` | cópia; merge de MCP | — |
| claude (projeto) | projeto | `.claude` | cópia; merge de MCP | — |
| codex | home | `.codex` | agents para TOML; `AGENTS.md` + `config.toml` | — |
| opencode | home | `.opencode` | cópia; plugin compilado em `dist/` | sim |
| cursor | projeto | `.cursor` | regras para `.mdc`; merge de MCP | — |
| kiro | projeto | `.kiro` | agents como `.md` + `.json`; merge de MCP | — |
| gemini | projeto | `.gemini` | arquivo único `GEMINI.md` | — |
| qwen | home | `.qwen` | arquivo único `QWEN.md` | — |
| zed | projeto | `.zed` | regras planas; merge de `settings.json` | — |
| codebuddy | projeto | `.codebuddy` | regras planas; script de instalação | — |
| joycode | projeto | `.joycode` | regras planas; script de instalação | — |
| antigravity | projeto | `.agent` | remapeia comandos/agents para workflows/skills | — |
| trae | projeto | `.trae` | regras planas; script de instalação | — |
| vscode | projeto | `.github` | `copilot-instructions.md` consolidado + `.vscode/settings.json` | — |

**Escopo:** provedores *home* mantêm uma configuração global por usuário (uma CLI); provedores *project* mantêm a configuração dentro do repositório (uma IDE/editor).

O registry é aberto. Novos provedores podem ser adicionados estendendo o registry com uma entrada real, um contrato de provedor, um módulo adaptador e um teste.

## Instalação

### Claude Code (nativo — alvo principal)

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

> Os comandos `/plugin` acima são exclusivos do Claude Code. Todos os outros provedores são instalados copiando para o local correto a pasta-ponto versionada do provedor.

### Outros provedores

A pasta-ponto de cada provedor é um artefato real, pronto para uso, regenerado por reprojeção — nunca a edite à mão. Provedores *home* (CLIs) são instalados no seu diretório home; provedores *project* (IDEs/editores) são instalados na raiz do repositório. Copie a pasta-ponto correspondente:

| Provedor | Escopo | Copiar para |
|----------|--------|-------------|
| codex | home | `~/.codex` |
| qwen | home | `~/.qwen` |
| opencode | home | `~/.opencode` — execute `node engine/build-opencode.js` primeiro |
| cursor | project | `<repo>/.cursor` |
| kiro | project | `<repo>/.kiro` |
| gemini | project | `<repo>/.gemini` |
| zed | project | `<repo>/.zed` |
| codebuddy | project | `<repo>/.codebuddy` |
| joycode | project | `<repo>/.joycode` |
| antigravity | project | `<repo>/.agent` |
| trae | project | `<repo>/.trae` |
| vscode | project | `<repo>/.github` (+ `.vscode/settings.json`) |

Consulte a [Matriz de provedores](#provider-matrix) para a transformação exata que cada provedor aplica.

## Uso

| Comando | O que faz |
|---------|-----------|
| `/global-plugins:generate <briefing>` | Gera um plugin multi-provedor a partir de uma descrição. |
| `/global-plugins:adapt <path>` | Adapta um plugin de provedor único para todos os provedores. |
| `/global-plugins:audit <path>` | Auditoria profunda e somente leitura de um plugin. |
| `/global-plugins:validate <path>` | Portão de validação rápido (passa/falha). |
| `/global-plugins:harness-lens <idea>` | Explora como uma ideia de plugin seria composta. |
| `/global-plugins:evolve <change>` | Espelha uma mudança canônica para cada provedor, com paridade, incremento de versão, changelog e uma migração condicional. |
| `/global-plugins:migrate [--dry-run \| --apply \| --rollback]` | Aplica a cadeia de migração pendente a uma cópia já instalada. |

O Global Plugins é autoexecutável: ele inclui sua própria superfície de evolução e migração e espelha os mesmos `/<plugin>:evolve` e `/<plugin>:migrate` em cada plugin que gera.

## Arquitetura interna

Fonte canônica → **resolver** (registry de provedores + manifestos em 3 camadas: profiles → modules → components) → módulos de **projeção** por provedor → **executor** de projeção. Uma lente de design composicional molda o harness de um plugin a partir de uma solicitação em linguagem natural. A governança (sincronização de SemVer, changelog, paridade, defesa de prompt, conformidade) é embutida no motor.

## Licença

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
