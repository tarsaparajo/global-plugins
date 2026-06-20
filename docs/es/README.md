**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | Español | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

Una única fuente canónica, todos los proveedores. Genera, adapta y evoluciona plugins de IA para programar a partir de una sola descripción.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

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
| codex | home | `.codex` | agents a TOML; índice `AGENTS.md` + archivos hermanos de skills/commands + `config.toml` | — |
| opencode | home | `.opencode` | copia; plugin compilado bajo `dist/` | sí |

**Ámbito:** los tres son proveedores *home* (CLIs): cada uno mantiene una configuración global por usuario en tu directorio de inicio.

El registro es abierto. Se pueden añadir nuevos proveedores ampliando el registro con una entrada real, un contrato de proveedor, un módulo adaptador y una prueba.

## Instalación

La carpeta de configuración versionada de cada proveedor es un artefacto real, listo para usar, regenerado mediante reproyección: nunca la edites a mano. Los tres son proveedores *home* (CLIs) y se instalan en tu directorio de inicio (`~/`). Elige tu proveedor a continuación.

### Claude Code

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

O copia `.claude` en `~/.claude`. Los comandos `/plugin` son exclusivos de Claude Code.

### Codex

```
cp -r .codex ~/.codex
```

Configuración global de la CLI. El índice `AGENTS.md`, `config.toml`, los archivos hermanos de skills/commands y `.codex/agents/*.toml` se detectan automáticamente cuando ejecutas `codex` en el proyecto.

### opencode

```
node engine/build-opencode.js   # primero compila el plugin
cp -r .opencode ~/.opencode
```

Configuración global de la CLI. El paso de compilación produce `.opencode/dist/` y es obligatorio antes de usarlo.

Consulta la [Matriz de proveedores](#provider-matrix) para ver la transformación exacta que aplica cada proveedor.

## Uso

| Comando | Qué hace |
|---------|----------|
| `/global-plugins:generate <briefing>` | Genera un plugin multiproveedor a partir de una descripción. |
| `/global-plugins:adapt <path>` | Adapta un plugin de un único proveedor a todos los proveedores. |
| `/global-plugins:audit <path>` | Auditoría profunda y de solo lectura de un plugin. |
| `/global-plugins:validate <path>` | Verificación rápida de aprobado/rechazado. |
| `/global-plugins:harness-lens <idea>` | Explora cómo se compondría una idea de plugin. |
| `/global-plugins:evolve <change>` | Refleja un cambio canónico en cada proveedor, con paridad, un incremento de versión, changelog y una migración condicional. |
| `/global-plugins:migrate [--dry-run \| --apply \| --rollback]` | Aplica la cadena de migración pendiente a una copia ya instalada. |

Global Plugins es autohospedado: incluye su propia superficie de evolve y migrate, y refleja los mismos `/<plugin>:evolve` y `/<plugin>:migrate` en cada plugin que genera.

## Arquitectura interna

Fuente canónica → **resolutor** (registro de proveedores + manifiestos de 3 niveles: perfiles → módulos → componentes) → módulos de **proyección** por proveedor → **ejecutor** de proyección. Una lente de diseño composicional moldea el arnés de un plugin a partir de una petición en lenguaje natural. La gobernanza (sincronización de SemVer, changelog, paridad, defensa de prompts, cumplimiento) está integrada en el motor.

## Licencia

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
