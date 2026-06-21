<div align="center">

**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | 한국어 | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

하나의 정규 소스로 모든 프로바이더에. 설명 하나로 AI 코딩 플러그인을 생성하고 적응시키고 발전시킵니다.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-0.7.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | 한국어 | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

</div>

---

## 개요

**Global Plugins**는 여러 프로바이더를 지원하는 AI 코딩 플러그인을 빌드하고 유지 관리합니다. 플러그인을 프로바이더에 종속되지 않는 **정규 소스(canonical source)** 형태로 한 번만 작성하면, 결정론적 엔진이 이를 지원되는 모든 프로바이더의 네이티브 포맷으로 **투영(project)**합니다. 투영된 결과물은 커밋되는 산출물입니다. 직접 손으로 수정하는 일은 절대 없으며, 항상 정규 소스로부터 다시 생성됩니다. 그 결과 하나의 진실(truth)로 여러 프로바이더를 완벽하게 동기화된 상태로 유지할 수 있습니다.

도구마다 별도의 사본을 관리하지 않고도 플러그인을 어디서나 동작시키고 싶은 누구에게나 적합하며, 깊은 기술 지식 없이도 평이한 언어로 설명되어 있습니다.

## 기능

### GENERATE (생성)

자연어로 플러그인을 설명하면 Global Plugins가 스킬, 에이전트, 훅, 커맨드, 권한에 이르는 전체 아키텍처를 설계하고, 선택한 모든 프로바이더로 투영합니다. 자가 진화 기능이 기본으로 내장되어 있습니다.

### ADAPT (적응)

단일 프로바이더용으로 만들어진 플러그인을 지정하면 Global Plugins가 이를 정규 형태로 끌어올린 뒤 모든 프로바이더로 투영하며, 원래 기능을 100% 보존합니다.

### EVOLVE (진화)

이 도구가 만들어 내는 모든 플러그인에는 자체 진화 엔진이 함께 제공됩니다. 정규 소스를 한 번만 수정하면 그 변경 사항이 모든 프로바이더에 그대로 반영됩니다. 이때 패리티 검증, 버전 상향, 체인지로그 및 원장(ledger) 항목 기록, 그리고 이미 설치된 사본을 위한 조건부 마이그레이션이 함께 수행됩니다. 무언가가 기록되기 전에 단 한 번의 확인 절차를 거칩니다.

## 프로바이더 매트릭스

| 프로바이더 | 범위 | 저장소 폴더 | 설치 위치 | 주요 변환 | 빌드 |
|----------|-------|-------------|-----------|-------------------|-------|
| claude | home | `.claude` | marketplace / `~/.claude` | 복사; MCP 병합 | — |
| codex | home | `.codex` | `~/.codex` | 에이전트를 TOML로; `AGENTS.md` 인덱스 + 형제 스킬/커맨드 파일 + `config.toml` | — |
| opencode | home | `.opencode` | `~/.config/opencode` | 복사; `dist/` 아래에 컴파일된 플러그인 | yes |

**범위:** 세 프로바이더 모두 *home* 프로바이더(CLI)이며, 각각 사용자별 전역 설정을 유지합니다. **저장소 폴더**는 이 저장소 내 도트 폴더 이름(투영 소스)이고, **설치 위치**는 해당 프로바이더가 읽을 수 있도록 그것을 배치하는 곳입니다.

레지스트리는 개방형입니다. 실제 항목, 프로바이더 계약(contract), 어댑터 모듈, 테스트를 추가해 레지스트리를 확장하는 방식으로 새 프로바이더를 추가할 수 있습니다.

## 설치

각 프로바이더의 커밋된 도트 폴더는 재투영으로 다시 생성되는 실제 사용 가능한 산출물입니다. 절대 직접 손으로 수정하지 마세요. 아래에서 사용하는 프로바이더를 선택하세요.

### Claude Code

Claude Code는 플러그인 마켓플레이스에서 설치하므로 클론이 필요 없습니다.

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

`/plugin` 커맨드는 Claude Code 전용입니다.

### Codex

Codex에는 이 플러그인에 대한 마켓플레이스 설치가 없으므로, 저장소를 클론한 뒤 그 `.codex` 폴더를 Codex의 전역 설정 디렉터리에 복사하세요.

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
cp -r .codex ~/.codex
```

Codex는 `~/.codex/`를 읽습니다. 다음번에 `codex`를 실행하면 `~/.codex/config.toml`, `AGENTS.md` 인덱스, `agents/*.toml` 역할, 형제 `skills/`/`commands/` 파일을 자동으로 감지합니다.

### opencode

opencode에는 이 플러그인에 대한 마켓플레이스 설치가 없으므로, 저장소를 클론하고 컴파일된 플러그인을 빌드한 뒤 그 `.opencode` 폴더를 opencode의 전역 설정 디렉터리에 복사하세요.

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
node engine/build-opencode.js          # 컴파일된 플러그인을 빌드합니다 (.opencode/dist/를 생성)
mkdir -p ~/.config/opencode
cp -r .opencode/. ~/.config/opencode/
```

opencode는 전역 설정을 `~/.config/opencode/`에서 읽습니다(`~/.opencode/`가 아님). 빌드 단계는 사용 전에 반드시 필요하며 `.opencode/dist/`를 생성합니다.

각 프로바이더가 적용하는 정확한 변환은 [프로바이더 매트릭스](#provider-matrix)를 참조하세요.

## 사용법

| 커맨드 | 동작 |
|---------|--------------|
| `/global-plugins:generate <briefing>` | 설명을 바탕으로 멀티 프로바이더 플러그인을 생성합니다. |
| `/global-plugins:adapt <path>` | 단일 프로바이더 플러그인을 모든 프로바이더로 적응시킵니다. |
| `/global-plugins:audit <path>` | 플러그인을 읽기 전용으로 심층 감사합니다. |
| `/global-plugins:validate <path>` | 빠른 합격/불합격 검증 게이트를 실행합니다. |
| `/global-plugins:harness-lens <idea>` | 플러그인 아이디어가 어떻게 구성될지 탐색합니다. |
| `/global-plugins:evolve <change>` | 정규 변경 사항을 모든 프로바이더에 반영하며, 패리티 검증, 버전 상향, 체인지로그, 조건부 마이그레이션을 함께 수행합니다. |
| `/global-plugins:migrate [--dry-run \| --apply \| --rollback]` | 이미 설치된 사본에 대기 중인 마이그레이션 체인을 적용합니다. |

Global Plugins는 자가 호스팅(self-hosting) 방식입니다. 자체 evolve 및 migrate 인터페이스를 제공하며, 자신이 생성하는 모든 플러그인에 동일한 `/<plugin>:evolve`와 `/<plugin>:migrate`를 그대로 반영합니다.

## 내부 아키텍처

정규 소스 → **리졸버**(프로바이더 레지스트리 + 3계층 매니페스트: 프로파일 → 모듈 → 컴포넌트) → 프로바이더별 **투영(projection)** 모듈 → 투영 **실행기(executor)**. 조합형(compositional) 설계 렌즈가 자연어 요청으로부터 플러그인의 하네스(harness)를 형성합니다. 거버넌스(SemVer 동기화, 체인지로그, 패리티, 프롬프트 방어, 컴플라이언스)는 엔진에 기본 내장되어 있습니다.

## 라이선스

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
