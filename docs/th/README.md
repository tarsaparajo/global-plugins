**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | ไทย | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

แหล่งข้อมูลแบบ canonical เดียว ครอบคลุมทุกผู้ให้บริการ สร้าง ปรับ และพัฒนาปลั๊กอินเขียนโค้ด AI จากคำอธิบายเดียว

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | ไทย | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

---

## ภาพรวม

**Global Plugins** สร้างและดูแลปลั๊กอิน AI coding แบบรองรับหลายผู้ให้บริการ คุณเขียนปลั๊กอินเพียงครั้งเดียวใน **canonical source** ที่เป็นกลางไม่ผูกกับผู้ให้บริการรายใด แล้วเอนจินแบบกำหนดผลลัพธ์ได้ (deterministic) จะ **ฉายภาพ (project)** มันออกไปเป็นรูปแบบเนทีฟของผู้ให้บริการที่รองรับทุกราย ผลลัพธ์ที่ได้จากการฉายภาพคือ artifact ที่ถูก commit ไว้ ซึ่งจะไม่ถูกแก้ไขด้วยมือ แต่ถูกสร้างใหม่จาก canonical source เสมอ สุดท้ายแล้วคุณจะได้ความจริงเดียว ใช้ได้กับหลายผู้ให้บริการ และซิงก์กันอย่างสมบูรณ์แบบ

เครื่องมือนี้เหมาะกับทุกคนที่ต้องการให้ปลั๊กอินทำงานได้ทุกที่โดยไม่ต้องดูแลสำเนาแยกต่างหากสำหรับแต่ละเครื่องมือ อธิบายด้วยภาษาธรรมดา ไม่จำเป็นต้องมีความรู้เชิงเทคนิคเชิงลึก

## ความสามารถ

### GENERATE (สร้างขึ้นใหม่)

อธิบายปลั๊กอินด้วยภาษาธรรมชาติ แล้ว Global Plugins จะออกแบบสถาปัตยกรรมทั้งหมดให้ ไม่ว่าจะเป็น skills, agents, hooks, commands, permissions และฉายภาพออกไปยังผู้ให้บริการทุกรายที่เลือกไว้ พร้อมความสามารถในการวิวัฒน์ตัวเอง (self-evolution) ในตัว

### ADAPT (ปรับให้เข้ากัน)

ชี้ไปที่ปลั๊กอินที่สร้างมาเพื่อผู้ให้บริการรายเดียว แล้ว Global Plugins จะยกระดับมันขึ้นสู่รูปแบบ canonical และฉายภาพออกไปยังผู้ให้บริการทุกราย โดยรักษาฟังก์ชันการทำงานดั้งเดิมไว้ครบ 100%

### EVOLVE (วิวัฒน์)

ทุกปลั๊กอินที่สร้างออกมาจะมาพร้อมเอนจินวิวัฒน์ของตัวเอง แก้ไข canonical source เพียงครั้งเดียว แล้วการเปลี่ยนแปลงนั้นจะถูกสะท้อนไปยังผู้ให้บริการทุกราย พร้อมการตรวจสอบความเท่าเทียม (parity validation) การเลื่อนเวอร์ชัน รายการ changelog และ ledger รวมถึงการ migration แบบมีเงื่อนไขสำหรับสำเนาที่ติดตั้งไปแล้ว ยืนยันเพียงครั้งเดียวก่อนจะมีการเขียนสิ่งใดลงไป

## ตารางผู้ให้บริการ

| Provider | ขอบเขต | Root | การแปลงที่น่าสนใจ | Build |
|----------|-------|------|-------------------|-------|
| claude | home | `.claude` | คัดลอก; MCP merge | — |
| claude (project) | project | `.claude` | คัดลอก; MCP merge | — |
| codex | home | `.codex` | agents เป็น TOML; `AGENTS.md` + `config.toml` | — |
| opencode | home | `.opencode` | คัดลอก; ปลั๊กอินที่คอมไพล์แล้วใต้ `dist/` | yes |
| cursor | project | `.cursor` | rules เป็น `.mdc`; MCP merge | — |
| kiro | project | `.kiro` | agents เป็น `.md` + `.json`; MCP merge | — |
| gemini | project | `.gemini` | ไฟล์เดียว `GEMINI.md` | — |
| qwen | home | `.qwen` | ไฟล์เดียว `QWEN.md` | — |
| zed | project | `.zed` | rules แบบ flat; `settings.json` merge | — |
| codebuddy | project | `.codebuddy` | rules แบบ flat; install script | — |
| joycode | project | `.joycode` | rules แบบ flat; install script | — |
| antigravity | project | `.agent` | remap commands/agents เป็น workflows/skills | — |
| trae | project | `.trae` | rules แบบ flat; install script | — |
| vscode | project | `.github` | รวมเป็น `copilot-instructions.md` + `.vscode/settings.json` | — |

**ขอบเขต:** ผู้ให้บริการแบบ *home* จะเก็บ config ระดับ global ต่อผู้ใช้หนึ่งคน (เป็น CLI) ส่วนผู้ให้บริการแบบ *project* จะเก็บ config ไว้ภายใน repository (เป็น IDE/editor)

registry เปิดให้ขยายได้ คุณสามารถเพิ่มผู้ให้บริการรายใหม่ได้ด้วยการขยาย registry ด้วย entry จริง provider contract โมดูล adapter และ test

## การติดตั้ง

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

หรือติดตั้งด้วยตนเองโดยคัดลอกไดเรกทอรีนี้ไปยังตำแหน่งปลั๊กอินของคุณ โฟลเดอร์ dotfolder ของผู้ให้บริการที่ถูก commit ไว้คือ artifact จริงที่ถูกสร้างใหม่ด้วยการฉายภาพซ้ำ อย่าแก้ไขด้วยมือเด็ดขาด

## วิธีใช้งาน

| คำสั่ง | ทำอะไร |
|---------|--------------|
| `/global-plugins:generate <briefing>` | สร้างปลั๊กอินแบบรองรับหลายผู้ให้บริการจากคำอธิบาย |
| `/global-plugins:adapt <path>` | ปรับปลั๊กอินที่รองรับผู้ให้บริการรายเดียวให้รองรับทุกราย |
| `/global-plugins:audit <path>` | ตรวจสอบปลั๊กอินเชิงลึกแบบอ่านอย่างเดียว |
| `/global-plugins:validate <path>` | ด่านตรวจสอบความถูกต้องแบบผ่าน/ไม่ผ่านอย่างรวดเร็ว |
| `/global-plugins:harness-lens <idea>` | สำรวจว่าไอเดียปลั๊กอินจะถูกประกอบขึ้นอย่างไร |
| `/global-plugins:evolve <change>` | สะท้อนการเปลี่ยนแปลงใน canonical ไปยังผู้ให้บริการทุกราย พร้อมการตรวจสอบความเท่าเทียม การเลื่อนเวอร์ชัน changelog และ migration แบบมีเงื่อนไข |
| `/global-plugins:migrate [--dry-run \| --apply \| --rollback]` | นำ migration ที่ค้างอยู่มาใช้กับสำเนาที่ติดตั้งไปแล้ว |

Global Plugins เป็นแบบ self-hosting คือมาพร้อมพื้นผิวคำสั่ง `evolve` และ `migrate` ของตัวเอง และสะท้อน `/<plugin>:evolve` และ `/<plugin>:migrate` แบบเดียวกันนี้ไปยังทุกปลั๊กอินที่มันสร้างขึ้น

## สถาปัตยกรรมภายใน

canonical source → **resolver** (provider registry + manifest แบบ 3 ชั้น: profiles → modules → components) → โมดูล **projection** ต่อผู้ให้บริการแต่ละราย → **executor** ของการฉายภาพ เลนส์การออกแบบเชิงประกอบ (compositional design lens) จะกำหนดรูปร่าง harness ของปลั๊กอินจากคำขอที่เป็นภาษาธรรมชาติ ส่วนการกำกับดูแล (การซิงก์ SemVer, changelog, parity, prompt-defense, compliance) ถูกสร้างไว้ในเอนจินแล้ว

## สัญญาอนุญาต

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
