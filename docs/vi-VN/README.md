<div align="center">

**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | Tiếng Việt | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

Một nguồn chuẩn, mọi nhà cung cấp. Tạo, điều chỉnh và tiến hóa các plugin lập trình AI từ một mô tả duy nhất.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-2.1.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | [Türkçe](../tr/README.md) | [Русский](../ru/README.md) | Tiếng Việt | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

</div>

---

## Tổng quan

**Global Plugins** xây dựng và bảo trì các plugin AI coding đa nhà cung cấp. Bạn chỉ cần viết plugin một lần duy nhất ở dạng **nguồn chính tắc** (canonical source) không phụ thuộc vào nhà cung cấp nào; một engine có tính tất định sẽ **chiếu** (project) nó sang định dạng gốc của từng nhà cung cấp được hỗ trợ. Các bản chiếu là những artifact được commit — không bao giờ chỉnh tay, luôn được tái tạo lại từ nguồn chính tắc. Kết quả: một sự thật duy nhất, nhiều nhà cung cấp, đồng bộ hoàn hảo.

Công cụ này dành cho bất kỳ ai muốn một plugin hoạt động ở mọi nơi mà không phải bảo trì một bản sao riêng cho từng tool — được mô tả bằng ngôn ngữ đời thường, không cần kiến thức kỹ thuật chuyên sâu.

## Khả năng

### GENERATE (Tạo mới)

Mô tả một plugin bằng ngôn ngữ tự nhiên và Global Plugins sẽ thiết kế toàn bộ kiến trúc của nó — skill, agent, hook, command, quyền hạn — rồi chiếu sang mọi nhà cung cấp bạn chọn, với khả năng tự tiến hóa được tích hợp sẵn.

### ADAPT (Chuyển đổi)

Chỉ vào một plugin được xây cho duy nhất một nhà cung cấp và Global Plugins sẽ nâng nó lên dạng chính tắc rồi chiếu sang tất cả các nhà cung cấp, giữ nguyên 100% chức năng ban đầu.

### EVOLVE (Tiến hóa)

Mọi plugin do nó tạo ra đều đi kèm engine tiến hóa riêng: chỉnh nguồn chính tắc một lần, và thay đổi sẽ được phản chiếu sang mọi nhà cung cấp — kèm theo kiểm tra tính tương đương (parity), nâng phiên bản, một mục changelog và ledger, cùng một bản di trú (migration) có điều kiện cho những bản đã cài đặt. Chỉ một lần xác nhận trước khi bất kỳ thứ gì được ghi.

## Ma trận nhà cung cấp

| Nhà cung cấp | Phạm vi | Thư mục trong repo | Cài đặt vào | Phép biến đổi đáng chú ý | Build |
|----------|-------|-------------|-------------|-------------------|-------|
| claude | home | `.claude` | marketplace / `~/.claude` | sao chép; gộp MCP | — |
| codex | home | `.codex` | `~/.codex` | agent sang TOML; chỉ mục `AGENTS.md` + các file skill/command đồng cấp + `config.toml` | — |
| opencode | home | `.opencode` | `~/.config/opencode` | sao chép; plugin đã biên dịch nằm trong `dist/` | có |

**Phạm vi:** cả ba đều là nhà cung cấp *home* (CLI) — mỗi nhà cung cấp giữ một config toàn cục theo từng người dùng. **Thư mục trong repo** là tên dotfolder trong repository này (nguồn để chiếu); **Cài đặt vào** là nơi bạn đặt nó để nhà cung cấp đó đọc được.

Registry là mở. Có thể bổ sung nhà cung cấp mới bằng cách mở rộng registry với một entry thực sự, một provider contract, một module adapter, và một bài test.

## Cài đặt

Dotfolder được commit của mỗi nhà cung cấp là một artifact thực sự, sẵn sàng sử dụng, được tái tạo qua quá trình chiếu lại — đừng bao giờ chỉnh tay nó. Hãy chọn nhà cung cấp của bạn bên dưới.

### Claude Code

Claude Code cài đặt từ một plugin marketplace — không cần clone:

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

Các lệnh `/plugin` chỉ dành cho Claude Code.

### Codex

Codex không có cài đặt qua marketplace cho plugin này, vì vậy hãy clone repo và sao chép thư mục `.codex` của nó vào thư mục config toàn cục của Codex:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
mkdir -p ~/.codex
cp -R .codex/. ~/.codex/
```

Codex đọc `~/.codex/`: nó tự động phát hiện `~/.codex/config.toml`, chỉ mục `AGENTS.md`, các role `[agents.<name>]`, và các file `skills/`/`commands/` đồng cấp ở lần tiếp theo bạn chạy `codex`.

### opencode

opencode không có cài đặt qua marketplace cho plugin này, vì vậy hãy clone repo, build plugin đã biên dịch, rồi sao chép thư mục `.opencode` của nó vào thư mục config toàn cục của opencode:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
node engine/build-opencode.js          # build the compiled plugin (produces .opencode/dist/)
mkdir -p ~/.config/opencode
cp -R .opencode/. ~/.config/opencode/
```

opencode đọc config toàn cục của nó từ `~/.config/opencode/` (không phải `~/.opencode/`). Bước build là bắt buộc trước khi sử dụng; nó tạo ra `.opencode/dist/`.

Xem [Ma trận nhà cung cấp](#provider-matrix) để biết chính xác phép biến đổi mà mỗi nhà cung cấp áp dụng.

## Cách dùng

| Lệnh | Tác dụng |
|---------|--------------|
| `/global-plugins:generate <briefing>` | Tạo một plugin đa nhà cung cấp từ một bản mô tả. |
| `/global-plugins:adapt <path>` | Chuyển đổi một plugin đơn nhà cung cấp sang tất cả các nhà cung cấp. |
| `/global-plugins:audit <path>` | Kiểm toán sâu, chỉ đọc, một plugin. |
| `/global-plugins:validate <path>` | Cổng kiểm định pass/fail nhanh gọn. |
| `/global-plugins:harness-lens <idea>` | Khám phá cách một ý tưởng plugin sẽ được cấu thành. |
| `/global-plugins:evolve <change>` | Phản chiếu một thay đổi chính tắc sang mọi nhà cung cấp, kèm theo parity, nâng phiên bản, changelog và một bản di trú có điều kiện. |
| `/global-plugins:migrate [--dry-run \| --apply \| --rollback]` | Áp dụng chuỗi di trú đang chờ vào một bản đã cài đặt sẵn. |

Global Plugins tự lưu trữ (self-hosting): nó đi kèm bề mặt evolve và migrate của riêng mình, và phản chiếu cùng `/<plugin>:evolve` và `/<plugin>:migrate` vào mọi plugin mà nó tạo ra.

**Tạo từ bất kỳ nhà cung cấp nào — không chỉ Claude Code.** Engine chiếu (projection engine) đi theo mỗi lần cài đặt dưới dạng runtime payload, nên một plugin đã cài có thể tự tạo/điều chỉnh/tiến hóa các plugin con đa nhà cung cấp từ cả ba CLI. Claude Code mang nó qua việc cài đặt toàn bộ kho mã; **Codex** và **opencode** mang nó trong thư mục con dành riêng `engine/` (`~/.codex/engine/`, `~/.config/opencode/engine/`). Trên Codex, agent chạy engine đóng gói bằng Node (`cd ~/.codex/engine && node scripts/evolve/project.mjs`, với một lần phê duyệt cho mỗi lần chạy); trên opencode, plugin đã biên dịch trong `dist/` cung cấp các công cụ gốc `generate`/`adapt`/`evolve`/`validate`/`migrate` được hỗ trợ bởi cùng payload đó. Mỗi plugin con được tạo ra cũng mang theo engine, nên nó tự cung tự cấp và có thể tự chiếu lại.

## Kiến trúc nội bộ

Nguồn chính tắc → **resolver** (registry nhà cung cấp + manifest 3 tầng: profile → module → component) → các module **chiếu** theo từng nhà cung cấp → **executor** chiếu. Một lăng kính thiết kế theo lối tổ hợp định hình harness của plugin từ một yêu cầu bằng ngôn ngữ tự nhiên. Quản trị (đồng bộ SemVer, changelog, parity, phòng vệ prompt, tuân thủ) được tích hợp ngay trong engine.

## Giấy phép

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
