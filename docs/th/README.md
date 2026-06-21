<div align="center">

**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | ไทย | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

แหล่งข้อมูลแบบ canonical เดียว ครอบคลุมทุกผู้ให้บริการ สร้าง ปรับ และพัฒนาปลั๊กอินเขียนโค้ด AI จากคำอธิบายเดียว

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-0.7.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | ไทย | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

</div>

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

| Provider | ขอบเขต | โฟลเดอร์ใน Repo | ติดตั้งไปที่ | การแปลงที่น่าสนใจ | Build |
|----------|-------|-------------|-------------|-------------------|-------|
| claude | home | `.claude` | marketplace / `~/.claude` | คัดลอก; MCP merge | — |
| codex | home | `.codex` | `~/.codex` | agents เป็น TOML; ดัชนี `AGENTS.md` + ไฟล์ skills/commands ระดับเดียวกัน + `config.toml` | — |
| opencode | home | `.opencode` | `~/.config/opencode` | คัดลอก; ปลั๊กอินที่คอมไพล์แล้วใต้ `dist/` | yes |

**ขอบเขต:** ทั้งสามรายเป็นผู้ให้บริการแบบ *home* (CLI) — แต่ละรายจะเก็บ config ระดับ global ต่อผู้ใช้หนึ่งคนไว้ **โฟลเดอร์ใน Repo** คือชื่อ dotfolder ในรีโพนี้ (แหล่งที่มาของการฉายภาพ) ส่วน **ติดตั้งไปที่** คือตำแหน่งที่คุณวางมันไว้เพื่อให้ผู้ให้บริการรายนั้นอ่านได้

registry เปิดให้ขยายได้ คุณสามารถเพิ่มผู้ให้บริการรายใหม่ได้ด้วยการขยาย registry ด้วย entry จริง provider contract โมดูล adapter และ test

## การติดตั้ง

โฟลเดอร์ dotfolder ที่ถูก commit ไว้ของผู้ให้บริการแต่ละรายคือ artifact จริงที่พร้อมใช้งาน ถูกสร้างใหม่ด้วยการฉายภาพซ้ำ อย่าแก้ไขด้วยมือเด็ดขาด เลือกผู้ให้บริการของคุณด้านล่าง

### Claude Code

Claude Code ติดตั้งจาก plugin marketplace โดยไม่ต้องโคลน:

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

คำสั่ง `/plugin` ใช้ได้กับ Claude Code เท่านั้น

### Codex

Codex ไม่มีการติดตั้งผ่าน marketplace สำหรับปลั๊กอินนี้ ดังนั้นให้โคลนรีโพแล้วคัดลอกโฟลเดอร์ `.codex` ของมันไปไว้ในไดเรกทอรี config ระดับ global ของ Codex:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
mkdir -p ~/.codex
cp -R .codex/. ~/.codex/
```

Codex อ่านจาก `~/.codex/`: มันจะตรวจจับ `~/.codex/config.toml`, ดัชนี `AGENTS.md`, roles `[agents.<name>]` และไฟล์ `skills/`/`commands/` ระดับเดียวกัน โดยอัตโนมัติในครั้งถัดไปที่คุณรัน `codex`

### opencode

opencode ไม่มีการติดตั้งผ่าน marketplace สำหรับปลั๊กอินนี้ ดังนั้นให้โคลนรีโพ build ปลั๊กอินที่คอมไพล์แล้ว จากนั้นคัดลอกโฟลเดอร์ `.opencode` ของมันไปไว้ในไดเรกทอรี config ระดับ global ของ opencode:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
node engine/build-opencode.js          # build the compiled plugin (produces .opencode/dist/)
mkdir -p ~/.config/opencode
cp -R .opencode/. ~/.config/opencode/
```

opencode อ่าน config ระดับ global ของมันจาก `~/.config/opencode/` (ไม่ใช่ `~/.opencode/`) ขั้นตอน build จำเป็นต้องทำก่อนใช้งาน โดยมันจะสร้าง `.opencode/dist/`

ดู[ตารางผู้ให้บริการ](#provider-matrix) สำหรับการแปลงที่แน่นอนซึ่งผู้ให้บริการแต่ละรายนำมาใช้

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

**สร้างจากผู้ให้บริการใดก็ได้ — ไม่ใช่แค่ Claude Code.** เอนจินการฉาย (projection engine) เดินทางไปกับทุกการติดตั้งในรูปแบบ runtime payload ดังนั้นปลั๊กอินที่ติดตั้งแล้วสามารถสร้าง/ปรับ/วิวัฒน์ปลั๊กอินลูกแบบหลายผู้ให้บริการได้ด้วยตัวเองจากทั้งสาม CLI โดย Claude Code นำพามันไปผ่านการติดตั้งทั้งรีโพ ส่วน **Codex** และ **opencode** นำพามันไว้ใต้ไดเรกทอรีย่อยสงวน `_engine/` (`~/.codex/_engine/`, `~/.config/opencode/_engine/`) บน Codex เอเจนต์จะรันเอนจินที่บันเดิลไว้ด้วย Node (`cd ~/.codex/_engine && node scripts/evolve/project.mjs` โดยมีการอนุมัติหนึ่งครั้งต่อการรัน) ส่วนบน opencode ปลั๊กอินที่คอมไพล์แล้วใน `dist/` จะเปิดเผยเครื่องมือเนทีฟ `generate`/`adapt`/`evolve`/`validate`/`migrate` ที่อาศัย payload เดียวกัน ปลั๊กอินลูกที่สร้างขึ้นทุกตัวก็พกเอนจินไปด้วย จึงพึ่งพาตัวเองได้และฉายใหม่ได้ด้วยตัวเอง

## สถาปัตยกรรมภายใน

canonical source → **resolver** (provider registry + manifest แบบ 3 ชั้น: profiles → modules → components) → โมดูล **projection** ต่อผู้ให้บริการแต่ละราย → **executor** ของการฉายภาพ เลนส์การออกแบบเชิงประกอบ (compositional design lens) จะกำหนดรูปร่าง harness ของปลั๊กอินจากคำขอที่เป็นภาษาธรรมชาติ ส่วนการกำกับดูแล (การซิงก์ SemVer, changelog, parity, prompt-defense, compliance) ถูกสร้างไว้ในเอนจินแล้ว

## สัญญาอนุญาต

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
