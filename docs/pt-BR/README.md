<div align="center">

**Language:** [English](../../README.md) | Português (Brasil) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

Uma fonte canônica, todos os provedores. Gere, adapte e evolua plugins de IA para programação a partir de uma única descrição.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | Português (Brasil) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

</div>

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

| Provedor | Escopo | Pasta no repositório | Instala em | Transformação notável | Build |
|----------|--------|----------------------|------------|-----------------------|-------|
| claude | home | `.claude` | marketplace / `~/.claude` | cópia; merge de MCP | — |
| codex | home | `.codex` | `~/.codex` | agents para TOML; índice `AGENTS.md` + arquivos irmãos de skills/commands + `config.toml` | — |
| opencode | home | `.opencode` | `~/.config/opencode` | cópia; plugin compilado em `dist/` | sim |

**Escopo:** os três são provedores *home* (CLIs) — cada um mantém uma configuração global por usuário. A **Pasta no repositório** é o nome da pasta-ponto neste repositório (a fonte da projeção); **Instala em** é onde você a coloca para que aquele provedor a leia.

O registry é aberto. Novos provedores podem ser adicionados estendendo o registry com uma entrada real, um contrato de provedor, um módulo adaptador e um teste.

## Instalação

A pasta-ponto versionada de cada provedor é um artefato real, pronto para uso, regenerado por reprojeção — nunca a edite à mão. Escolha o seu provedor abaixo.

### Claude Code

O Claude Code instala a partir de um marketplace de plugins — sem necessidade de clonar:

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

Os comandos `/plugin` são exclusivos do Claude Code.

### Codex

O Codex não tem instalação via marketplace para este plugin, então clone o repositório e copie a pasta `.codex` para o diretório de configuração global do Codex:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
mkdir -p ~/.codex
cp -R .codex/. ~/.codex/
```

O Codex lê `~/.codex/`: ele detecta automaticamente o `~/.codex/config.toml`, o índice `AGENTS.md`, os papéis em `[agents.<name>]` e os arquivos irmãos `skills/`/`commands/` na próxima vez que você executar `codex`.

### opencode

O opencode não tem instalação via marketplace para este plugin, então clone o repositório, compile o plugin e então copie a pasta `.opencode` para o diretório de configuração global do opencode:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
node engine/build-opencode.js          # build the compiled plugin (produces .opencode/dist/)
mkdir -p ~/.config/opencode
cp -R .opencode/. ~/.config/opencode/
```

O opencode lê sua configuração global de `~/.config/opencode/` (não de `~/.opencode/`). O passo de build é obrigatório antes do uso; ele produz `.opencode/dist/`.

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

**Gere a partir de qualquer provedor — não só do Claude Code.** O motor de projeção viaja com toda instalação como um runtime payload, então um plugin instalado pode ele mesmo criar/adaptar/evoluir plugins filhos multiprovedor a partir das três CLIs. O Claude Code o carrega via instalação do repositório inteiro; o **Codex** e o **opencode** o carregam sob um subdiretório reservado `_engine/` (`~/.codex/_engine/`, `~/.config/opencode/_engine/`). No Codex o agente roda o motor empacotado com o Node (`cd ~/.codex/_engine && node scripts/evolve/project.mjs`, com uma aprovação por execução); no opencode o plugin compilado em `dist/` expõe ferramentas nativas `generate`/`adapt`/`evolve`/`validate`/`migrate` apoiadas pelo mesmo payload. Todo filho gerado também leva o motor, então é autossuficiente e reprojetável por conta própria.

## Arquitetura interna

Fonte canônica → **resolver** (registry de provedores + manifestos em 3 camadas: profiles → modules → components) → módulos de **projeção** por provedor → **executor** de projeção. Uma lente de design composicional molda o harness de um plugin a partir de uma solicitação em linguagem natural. A governança (sincronização de SemVer, changelog, paridade, defesa de prompt, conformidade) é embutida no motor.

## Licença

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
