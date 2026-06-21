<div align="center">

**Language:** [English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | Türkçe | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

# Global Plugins

![Global Plugins](../../assets/hero.png)

Tek bir kanonik kaynak, her sağlayıcı. Tek bir açıklamadan AI kodlama eklentileri oluşturun, uyarlayın ve geliştirin.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](../../VERSION)
[![Buy Me A Coffee](https://img.shields.io/badge/support-buymeacoffee-yellow.svg)](https://buymeacoffee.com/tarsaparajo)

**Language / 语言 / 語言 / Dil / Язык / Ngôn ngữ / Idioma / Idioma / Langue / Lingua**

[English](../../README.md) | [Português (Brasil)](../pt-BR/README.md) | [简体中文](../zh-CN/README.md) | [繁體中文](../zh-TW/README.md) | [日本語](../ja-JP/README.md) | [한국어](../ko-KR/README.md) | Türkçe | [Русский](../ru/README.md) | [Tiếng Việt](../vi-VN/README.md) | [ไทย](../th/README.md) | [Deutsch](../de-DE/README.md) | [Español](../es/README.md) | [Français](../fr/README.md) | [Italiano](../it/README.md)

</div>

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

| Sağlayıcı | Kapsam | Depo klasörü | Kurulduğu yer | Dikkat çeken dönüşüm | Derleme |
|----------|-------|-------------|---------------|-------------------|-------|
| claude | home | `.claude` | marketplace / `~/.claude` | kopyalama; MCP birleştirme | — |
| codex | home | `.codex` | `~/.codex` | agent'ları TOML'a; `AGENTS.md` indeksi + skill/komut kardeş dosyaları + `config.toml` | — |
| opencode | home | `.opencode` | `~/.config/opencode` | kopyalama; `dist/` altında derlenmiş eklenti | evet |

**Kapsam:** üçü de *home* sağlayıcısıdır (CLI'lar) — her biri kullanıcı başına genel bir yapılandırma tutar. **Depo klasörü**, bu depodaki nokta klasörü adıdır (yansıtma kaynağı); **Kurulduğu yer**, o sağlayıcının okuması için onu yerleştirdiğiniz konumdur.

Kayıt defteri (registry) açıktır. Kayıt defterini gerçek bir girdi, bir sağlayıcı sözleşmesi (contract), bir adaptör modülü ve bir testle genişleterek yeni sağlayıcılar eklenebilir.

## Kurulum

Her sağlayıcının commit edilmiş nokta klasörü, yeniden yansıtmayla üretilen gerçek, kullanıma hazır bir yapıttır; asla elle düzenlemeyin. Aşağıdan sağlayıcınızı seçin.

### Claude Code

Claude Code, bir eklenti marketplace'inden kurulur; klonlamaya gerek yoktur:

```
/plugin marketplace add tarsaparajo/global-plugins
/plugin install tarsaparajo@global-plugins
```

`/plugin` komutları yalnızca Claude Code içindir.

### Codex

Codex'in bu eklenti için marketplace kurulumu yoktur; bu yüzden depoyu klonlayın ve `.codex` klasörünü Codex'in genel yapılandırma dizinine kopyalayın:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
mkdir -p ~/.codex
cp -R .codex/. ~/.codex/
```

Codex, `~/.codex/` dizinini okur: `codex` komutunu bir sonraki çalıştırışınızda `~/.codex/config.toml`, `AGENTS.md` indeksi, `[agents.<name>]` rolleri ve kardeş `skills/`/`commands/` dosyaları otomatik olarak algılanır.

### opencode

opencode'un bu eklenti için marketplace kurulumu yoktur; bu yüzden depoyu klonlayın, derlenmiş eklentiyi oluşturun, ardından `.opencode` klasörünü opencode'un genel yapılandırma dizinine kopyalayın:

```
git clone https://github.com/tarsaparajo/global-plugins
cd global-plugins
node engine/build-opencode.js          # derlenmiş eklentiyi oluştur (.opencode/dist/ üretir)
mkdir -p ~/.config/opencode
cp -R .opencode/. ~/.config/opencode/
```

opencode, genel yapılandırmasını `~/.config/opencode/` dizininden okur (`~/.opencode/` değil). Derleme adımı kullanımdan önce gereklidir; `.opencode/dist/` klasörünü üretir.

Her sağlayıcının uyguladığı tam dönüşüm için [Sağlayıcı Matrisi](#provider-matrix) bölümüne bakın.

## Kullanım

| Komut | Ne yapar |
|---------|--------------|
| `/global-plugins:generate <briefing>` | Bir açıklamadan çok sağlayıcılı bir eklenti üretir. |
| `/global-plugins:adapt <path>` | Tek sağlayıcılı bir eklentiyi tüm sağlayıcılara uyarlar. |
| `/global-plugins:audit <path>` | Bir eklentinin derinlemesine, salt okunur denetimini yapar. |
| `/global-plugins:validate <path>` | Hızlı geçti/kaldı doğrulama kapısı. |
| `/global-plugins:harness-lens <idea>` | Bir eklenti fikrinin nasıl kurgulanacağını keşfeder. |
| `/global-plugins:evolve <change>` | Kanonik bir değişikliği her sağlayıcıya yansıtır; eşlik (parity), bir sürüm artışı, changelog ve koşullu bir geçiş (migration) ile birlikte. |
| `/global-plugins:migrate [--dry-run \| --apply \| --rollback]` | Bekleyen geçiş (migration) zincirini halihazırda kurulu bir kopyaya uygular. |

Global Plugins kendi kendine barındırılır (self-hosting): kendi evolve ve migrate yüzeyiyle birlikte gelir ve aynı `/<plugin>:evolve` ve `/<plugin>:migrate`'i ürettiği her eklentiye yansıtır.

**Herhangi bir sağlayıcıdan üretin — yalnızca Claude Code'dan değil.** Projeksiyon motoru her kuruluma bir runtime payload olarak eşlik eder; böylece kurulu bir eklenti üç CLI'nin tamamından çok sağlayıcılı alt eklentileri kendisi oluşturabilir/uyarlayabilir/evrimleştirebilir. Claude Code onu tüm depo kurulumuyla taşır; **Codex** ve **opencode** onu ayrılmış bir `_engine/` alt klasöründe taşır (`~/.codex/_engine/`, `~/.config/opencode/_engine/`). Codex'te ajan, paketlenmiş motoru Node ile çalıştırır (`cd ~/.codex/_engine && node scripts/evolve/project.mjs`, çalıştırma başına bir onay ile); opencode'da `dist/` içindeki derlenmiş eklenti, aynı payload tarafından desteklenen yerel `generate`/`adapt`/`evolve`/`validate`/`migrate` araçlarını sunar. Üretilen her alt eklenti de motoru taşır; bu yüzden kendi kendine yeterlidir ve tek başına yeniden projeksiyonlanabilir.

## İç Mimari

Kanonik kaynak → **çözümleyici (resolver)** (sağlayıcı kayıt defteri + 3 katmanlı manifestler: profiller → modüller → bileşenler) → sağlayıcı başına **yansıtma (projection)** modülleri → yansıtma **yürütücüsü (executor)**. Kompozisyonel bir tasarım merceği, doğal dildeki bir istekten bir eklentinin koşum takımını (harness) şekillendirir. Yönetişim (SemVer eşitleme, changelog, eşlik, prompt savunması, uyumluluk) motorun içine yerleşiktir.

## Lisans

MIT — Tarsa · [buymeacoffee.com/tarsaparajo](https://buymeacoffee.com/tarsaparajo)
