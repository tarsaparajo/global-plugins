<div align="center">

**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | Español | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

Una única fuente canónica, todos los proveedores. Genera, adapta y evoluciona plugins de IA para programar a partir de una sola descripción.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-0.7.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | Español | [Français](../fr/README.md) | [Italiano](../it/README.md)

</div>

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

| Proveedor | Ámbito | Carpeta del repo | Se instala en | Transformación destacada | Build |
|-----------|--------|------------------|---------------|--------------------------|-------|
| claude | home | `.claude` | marketplace / `~/.claude` | copia; fusión de MCP | — |
| codex | home | `.codex` | `~/.codex` | agents a TOML; índice `AGENTS.md` + archivos hermanos de skills/commands + `config.toml` | — |
| opencode | home | `.opencode` | `~/.config/opencode` | copia; plugin compilado bajo `dist/` | sí |

**Ámbito:** los tres son proveedores *home* (CLIs): cada uno mantiene una configuración global por usuario. **Carpeta del repo** es el nombre de la carpeta oculta en este repositorio (la fuente de proyección); **Se instala en** es el lugar donde la colocas para que ese proveedor la lea.

El registro es abierto. Se pueden añadir nuevos proveedores ampliando el registro con una entrada real, un contrato de proveedor, un módulo adaptador y una prueba.

## Instalación

La carpeta de configuración versionada de cada proveedor es un artefacto real, listo para usar, regenerado mediante reproyección: nunca la edites a mano. Elige tu proveedor a continuación.

### Claude Code

Claude Code se instala desde un marketplace de plugins, sin necesidad de clonar:

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

Los comandos `/plugin` son exclusivos de Claude Code.

### Codex

Codex no tiene instalación por marketplace para este plugin, así que clona el repositorio y copia su carpeta `.codex` en el directorio de configuración global de Codex:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
mkdir -p ~/.codex
cp -R .codex/. ~/.codex/
```

Codex lee `~/.codex/`: detecta automáticamente `~/.codex/config.toml`, el índice `AGENTS.md`, los roles `[agents.<name>]` y los archivos hermanos de `skills/`/`commands/` la próxima vez que ejecutas `codex`.

### opencode

opencode no tiene instalación por marketplace para este plugin, así que clona el repositorio, compila el plugin y luego copia su carpeta `.opencode` en el directorio de configuración global de opencode:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
node engine/build-opencode.js          # compila el plugin (produce .opencode/dist/)
mkdir -p ~/.config/opencode
cp -R .opencode/. ~/.config/opencode/
```

opencode lee su configuración global desde `~/.config/opencode/` (no `~/.opencode/`). El paso de compilación es obligatorio antes de usarlo; produce `.opencode/dist/`.

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

**Genera desde cualquier proveedor — no solo desde Claude Code.** El motor de proyección viaja con cada instalación como un runtime payload, así que un plugin instalado puede él mismo crear/adaptar/evolucionar plugins hijos multiproveedor desde las tres CLIs. Claude Code lo lleva mediante la instalación del repositorio completo; **Codex** y **opencode** lo llevan bajo un subdirectorio reservado `_engine/` (`~/.codex/_engine/`, `~/.config/opencode/_engine/`). En Codex el agente ejecuta el motor empaquetado con Node (`cd ~/.codex/_engine && node scripts/evolve/project.mjs`, con una aprobación por ejecución); en opencode el plugin compilado en `dist/` expone herramientas nativas `generate`/`adapt`/`evolve`/`validate`/`migrate` respaldadas por el mismo payload. Cada hijo generado también lleva el motor, por lo que es autosuficiente y reproyectable por sí mismo.

## Arquitectura interna

Fuente canónica → **resolutor** (registro de proveedores + manifiestos de 3 niveles: perfiles → módulos → componentes) → módulos de **proyección** por proveedor → **ejecutor** de proyección. Una lente de diseño composicional moldea el arnés de un plugin a partir de una petición en lenguaje natural. La gobernanza (sincronización de SemVer, changelog, paridad, defensa de prompts, cumplimiento) está integrada en el motor.

## Licencia

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
