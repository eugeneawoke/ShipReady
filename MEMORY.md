# MEMORY

> Постоянная память. Переживает compaction, паузы, новые сессии.
> Re-inject целиком после каждого /compact.
> Не удалять записи — только добавлять или помечать [устарело].

---

## Контекст основателя

- Евгений, Минск. AI-native дизайнер + vibe coder. 8 лет QA (web, mobile, gamedev).
- Стек: Figma + Cursor/Bolt/v0 + Vercel + Supabase + Make.com
- Строит параллельно с обучением — MVP за 2 недели, время ограничено
- Рынки: СНГ первично (vc.ru, Telegram) + international (Product Hunt, HN)
- Язык разработки: TypeScript. Язык общения: русский.

---

## Продуктовые решения (зафиксированы)

- **Главный моат:** AI fix prompts (tool-agnostic) для каждого issue + evidence-based confidence model.
- **Позиционирование:** Free website audit — "Find out why your site isn't getting found."
  Аудитория: solo founders, разработчики, агентства и все кто хочет появляться
  в Google, ChatGPT, Claude, Codex, Gemini, Perplexity. Tool-agnostic fix prompts.
- **Tagline:** "Know why your site isn't getting found. Fix it."
- **Дизайн-референс:** Framer. Тёмный (#0E0E0F), data-first, Geist + Geist Mono, акцент #6E56CF.
- **Paywall механика:** blur на AI prompts для free — самый конвертирующий момент апсейла.
- **Ключевой дифференциатор:** AI visibility как отдельная категория (ChatGPT, Claude, Gemini,
  Perplexity, Google AI Overview) + SEO + Security + evidence-based confidence model (verified/likely/heuristic).

---

## Технические инсайты (не переоткрывать)

- Lighthouse на Vercel: только `@sparticuz/chromium`, `memory:3009MB`, `maxDuration:60`. Без этого — OOM или timeout.
- Exposed .env check: проверять что body содержит `KEY=value` И не содержит `<html` — иначе false positive от 404-страниц.
- API key detection: логировать ТИП ключа (OpenAI key), никогда не сам ключ.
- HTML fetчится один раз в оркестраторе, передаётся строкой. Функции `runSEOChecks(url, html)` — html второй параметр.
- [устарело] Lemon Squeezy не используем: провайдер не подходит для страны основателя. Billing должен быть provider-agnostic, платёжный провайдер будет выбран позже.

---

## Конкурентная карта (не переисследовать)

| Инструмент | Делает | Не делает |
|------------|--------|-----------|
| Cheeeck.com | SEO+Perf+A11y+OG за $25/мес | AI prompts, RU, vibe-native |
| VibeEval | Security (auth bypass) | SEO, Performance, OG |
| ShipSecure | Security headers | Всё остальное |
| Lighthouse | Perf+SEO+A11y, бесплатно | Security, OG preview, AI |
| Aikido | Enterprise SAST/DAST | Для indie, без setup |
| sitepravo.ru | Юридический аудит (РФ, ФЗ-152, ПДн) | Другая ниша, не конкурент |

**Наша ниша:** AI visibility + SEO + Security audit + evidence-based report + fix prompts (tool-agnostic) + RU/EN = сильная дифференциация.

---

## Что НЕ делаем в v1 (финальные решения)

- Глубокий DAST (auth bypass, runtime XSS) — это VibeEval
- Мультистраничный краулинг — только главная страница
- CI/CD интеграция — v2
- GitHub Action — v2

---

## Лог сессий

| Дата | Сделано | Следующий шаг |
|------|---------|---------------|
| —    | —       | —             |
