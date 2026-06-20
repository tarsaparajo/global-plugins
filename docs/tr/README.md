**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | Türkçe | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

Tek bir kanonik kaynak, her sağlayıcı. Tek bir açıklamadan AI kodlama eklentileri oluşturun, uyarlayın ve geliştirin.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | Türkçe | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

---

## Genel Bakış

**Global Plugins**, çok sağlayıcılı yapay zeka kodlama eklentileri üretir ve bunların bakımını yapar. Bir eklentiyi sağlayıcıdan bağımsız bir **kanonik kaynakta** bir kez yazarsınız; deterministik bir motor onu desteklenen her sağlayıcının yerel biçimine **yansıtır**. Yansıtmalar, commit edilen yapıtlardır; asla elle düzenlenmez, her zaman kanonik kaynaktan yeniden üretilir. Sonuç: tek bir doğru kaynak, birçok sağlayıcı, kusursuz eşitlenmiş.

Bu araç, bir eklentinin her araç için ayrı bir kopyasını sürdürmeden her yerde çalışmasını isteyen herkes içindir; derin teknik bilgi gerektirmeden, sade bir dille anlatılmıştır.

## Yetenekler

### GENERATE (Üret)

Bir eklentiyi doğal dilde tarif edin; Global Plugins onun tüm mimarisini (skill'ler, agent'lar, hook'lar, komutlar, izinler) tasarlar ve seçtiğiniz her sağlayıcıya yansıtır; üstelik kendi kendini geliştirme yeteneği de yerleşik gelir.

### ADAPT (Uyarla)

Tek bir sağlayıcı için yazılmış bir eklentiyi gösterin; Global Plugins onu kanonik biçime taşır ve özgün işlevselliğini %100 koruyarak tüm sağlayıcılara yansıtır.

### EVOLVE (Geliştir)

Ürettiği her eklenti, kendi geliştirme motoruyla birlikte gelir: kanonik kaynağı bir kez düzenleyin, değişiklik her sağlayıcıya yansıtılsın; eşlik (parity) doğrulaması, bir sürüm artışı, bir changelog ve ledger kaydı ve halihazırda kurulu kopyalar için koşullu bir geçiş (migration) ile birlikte. Hiçbir şey yazılmadan önce tek bir onay alınır.

## Sağlayıcı Matrisi

| Sağlayıcı | Kapsam | Kök | Dikkat çeken dönüşüm | Derleme |
|----------|-------|------|-------------------|-------|
| claude | home | `.claude` | kopyalama; MCP birleştirme | — |
| claude (proje) | proje | `.claude` | kopyalama; MCP birleştirme | — |
| codex | home | `.codex` | agent'ları TOML'a; `AGENTS.md` + `config.toml` | — |
| opencode | home | `.opencode` | kopyalama; `dist/` altında derlenmiş eklenti | evet |
| cursor | proje | `.cursor` | kurallar `.mdc`'ye; MCP birleştirme | — |
| kiro | proje | `.kiro` | agent'lar `.md` + `.json` olarak; MCP birleştirme | — |
| gemini | proje | `.gemini` | tek dosyalık `GEMINI.md` | — |
| qwen | home | `.qwen` | tek dosyalık `QWEN.md` | — |
| zed | proje | `.zed` | düz kurallar; `settings.json` birleştirme | — |
| codebuddy | proje | `.codebuddy` | düz kurallar; kurulum betiği | — |
| joycode | proje | `.joycode` | düz kurallar; kurulum betiği | — |
| antigravity | proje | `.agent` | komutları/agent'ları workflow'lara/skill'lere yeniden eşleme | — |
| trae | proje | `.trae` | düz kurallar; kurulum betiği | — |
| vscode | proje | `.github` | birleştirilmiş `copilot-instructions.md` + `.vscode/settings.json` | — |

**Kapsam:** *home* sağlayıcıları, kullanıcı başına genel bir yapılandırma tutar (bir CLI); *project* sağlayıcıları ise yapılandırmayı deponun içinde tutar (bir IDE/editör).

Kayıt defteri (registry) açıktır. Kayıt defterini gerçek bir girdi, bir sağlayıcı sözleşmesi (contract), bir adaptör modülü ve bir testle genişleterek yeni sağlayıcılar eklenebilir.

## Kurulum

Bir eklenti pazar yerinden kurun ya da bu dizini eklentilerinizin bulunduğu konuma kopyalayarak elle kurun. Commit edilen sağlayıcı nokta klasörleri gerçek yapıtlardır ve yeniden yansıtmayla üretilir; bunları asla elle düzenlemeyin.

## Kullanım

| Komut | Ne yapar |
|---------|--------------|
| `/global-plugins:generate <briefing>` | Bir açıklamadan çok sağlayıcılı bir eklenti üretir. |
| `/global-plugins:adapt <path>` | Tek sağlayıcılı bir eklentiyi tüm sağlayıcılara uyarlar. |
| `/global-plugins:audit <path>` | Bir eklentinin derinlemesine, salt okunur denetimini yapar. |
| `/global-plugins:validate <path>` | Hızlı geçti/kaldı doğrulama kapısı. |
| `/global-plugins:harness-lens <idea>` | Bir eklenti fikrinin nasıl kurgulanacağını keşfeder. |

Üretilen eklentiler, kendi kendini geliştirme için ayrıca `/<plugin>:evolve` ve `/<plugin>:migrate` ile birlikte gelir.

## İç Mimari

Kanonik kaynak → **çözümleyici (resolver)** (sağlayıcı kayıt defteri + 3 katmanlı manifestler: profiller → modüller → bileşenler) → sağlayıcı başına **yansıtma (projection)** modülleri → yansıtma **yürütücüsü (executor)**. Kompozisyonel bir tasarım merceği, doğal dildeki bir istekten bir eklentinin koşum takımını (harness) şekillendirir. Yönetişim (SemVer eşitleme, changelog, eşlik, prompt savunması, uyumluluk) motorun içine yerleşiktir.

## Lisans

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
