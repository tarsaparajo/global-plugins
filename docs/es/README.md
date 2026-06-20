**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | Español | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | Español | [Français](../fr/README.md) | [Italiano](../it/README.md)

---

## Visión general

**Global Plugins** construye y mantiene plugins de IA para programación compatibles con múltiples proveedores. Escribes un plugin una sola vez en una **fuente canónica** neutral respecto al proveedor; un motor determinista lo **proyecta** al formato nativo de cada proveedor compatible. Las proyecciones son artefactos versionados: nunca se editan a mano, siempre se regeneran a partir de la fuente canónica. El resultado: una única verdad, muchos proveedores, perfectamente sincronizados.

Es para cualquiera que quiera que un plugin funcione en todas partes sin mantener una copia separada por herramienta, descrito en lenguaje sencillo y sin necesidad de conocimientos técnicos profundos.

## Capacidades

### GENERATE (Generar)

Describe un plugin en lenguaje natural y Global Plugins diseña toda su arquitectura (skills, agents, hooks, comandos, permisos) y lo proyecta a cada proveedor seleccionado, con autoevolución incorporada.

### ADAPT (Adaptar)

Apunta a un plugin creado para un único proveedor y Global Plugins lo eleva a su forma canónica y lo proyecta a todos los proveedores, conservando el 100 % de su funcionalidad original.

### EVOLVE (Evolucionar)

Cada plugin que produce viene con su propio motor de evolución: edita la fuente canónica una sola vez y el cambio se refleja en cada proveedor, con validación de paridad, un incremento de versión, una entrada en el changelog y en el registro, y una migración condicional para las copias ya instaladas. Una sola confirmación antes de escribir nada.

## Matriz de proveedores

| Proveedor | Ámbito | Raíz | Transformación destacada | Build |
|-----------|--------|------|--------------------------|-------|
| claude | home | `.claude` | copia; fusión de MCP | — |
| claude (proyecto) | proyecto | `.claude` | copia; fusión de MCP | — |
| codex | home | `.codex` | agents a TOML; `AGENTS.md` + `config.toml` | — |
| opencode | home | `.opencode` | copia; plugin compilado bajo `dist/` | sí |
| cursor | proyecto | `.cursor` | reglas a `.mdc`; fusión de MCP | — |
| kiro | proyecto | `.kiro` | agents como `.md` + `.json`; fusión de MCP | — |
| gemini | proyecto | `.gemini` | archivo único `GEMINI.md` | — |
| qwen | home | `.qwen` | archivo único `QWEN.md` | — |
| zed | proyecto | `.zed` | reglas planas; fusión de `settings.json` | — |
| codebuddy | proyecto | `.codebuddy` | reglas planas; script de instalación | — |
| joycode | proyecto | `.joycode` | reglas planas; script de instalación | — |
| antigravity | proyecto | `.agent` | reasigna comandos/agents a workflows/skills | — |
| trae | proyecto | `.trae` | reglas planas; script de instalación | — |
| vscode | proyecto | `.github` | `copilot-instructions.md` consolidado + `.vscode/settings.json` | — |

**Ámbito:** los proveedores *home* mantienen una configuración global por usuario (una CLI); los proveedores *project* mantienen la configuración dentro del repositorio (un IDE/editor).

El registro es abierto. Se pueden añadir nuevos proveedores ampliando el registro con una entrada real, un contrato de proveedor, un módulo adaptador y una prueba.

## Instalación

Instálalo desde un marketplace de plugins, o manualmente copiando este directorio en la ubicación de tus plugins. Las carpetas de configuración por proveedor que se incluyen versionadas son artefactos reales, regenerados mediante reproyección: nunca las edites a mano.

## Uso

| Comando | Qué hace |
|---------|----------|
| `/global-plugins:generate <briefing>` | Genera un plugin multiproveedor a partir de una descripción. |
| `/global-plugins:adapt <path>` | Adapta un plugin de un único proveedor a todos los proveedores. |
| `/global-plugins:audit <path>` | Auditoría profunda y de solo lectura de un plugin. |
| `/global-plugins:validate <path>` | Verificación rápida de aprobado/rechazado. |
| `/global-plugins:harness-lens <idea>` | Explora cómo se compondría una idea de plugin. |

Los plugins generados incluyen además `/<plugin>:evolve` y `/<plugin>:migrate` para la autoevolución.

## Arquitectura interna

Fuente canónica → **resolutor** (registro de proveedores + manifiestos de 3 niveles: perfiles → módulos → componentes) → módulos de **proyección** por proveedor → **ejecutor** de proyección. Una lente de diseño composicional moldea el arnés de un plugin a partir de una petición en lenguaje natural. La gobernanza (sincronización de SemVer, changelog, paridad, defensa de prompts, cumplimiento) está integrada en el motor.

## Licencia

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
