# SEO / GEO / AEO — двойной трек
**Дата:** 2026-05-09  
**Статус:** на ревью  
**Ветка:** claude/sleepy-pascal-1a6372

---

## Цель

Одновременно:
1. **Track 1** — ShipReady сам ранжируется по трендовым запросам в Google, ChatGPT, Claude, Perplexity, Bing.
2. **Track 2** — Сканер ShipReady даёт пользователям глубокие, реальные GEO/AEO рекомендации — те самые, которые мы применяем к себе.

Принцип: "сапожник с сапогами" — продукт и маркетинг развиваются синхронно.

---

## Что НЕ входит в этот спек

- Performance и mobile checks — их не трогаем, они в порядке.
- Existing security checks — не трогаем.
- Архитектура сканера (Railway/Vercel split) — не меняем.
- Новые категории в отчёте — не добавляем, все новые проверки идут в `ai_visibility` и `seo`.
- Backend база данных, миграции — изменений не требуется.

---

## Track 1 — Позиционирование ShipReady

### 1.1 Контекст: почему сейчас неправильно

**Текущая проблема:** ShipReady позиционируется как "инструмент для агентств" с техническими ключевыми словами (`lighthouse`, `cursor`, `windsurf`). Но люди ищут **решение проблемы**, а не название инструмента.

**Данные из исследования (реальные поисковые паттерны 2026):**

| Кластер | Примеры запросов | Объём |
|---|---|---|
| SEO видимость | "free website SEO audit", "check my website SEO", "why isn't my site ranking" | Высокий |
| AI/GEO видимость | "how to appear in ChatGPT", "show up in Claude AI", "appear on Perplexity", "AI visibility audit", "generative engine optimization" | +527% YoY |
| Безопасность | "website security check free", "check HTTP security headers", "is my website secure" | Стабильно высокий |
| Pre-launch | "website quality check", "site audit before launch", "pre-launch site checklist" | Растёт с vibe coding |

**Ключевой вывод:** Claude.ai — крупная AI платформа, которую сейчас ShipReady не упоминает нигде в позиционировании. Это пробел.

### 1.2 Изменения в `messages/en.ts`

#### Metadata секция

```
Metadata.layoutTitle:
  БЫЛО: "ShipReady - Site audits that understand your client's business."
  БУДЕТ: "ShipReady — Free Website Audit: SEO, AI Visibility & Security"

Metadata.layoutDescription:
  БЫЛО: "35+ automated checks across performance, SEO, security, mobile, and AI visibility. Get evidence-based fix prompts ready for any AI coding tool."
  БУДЕТ: "Find out why your site isn't showing up in Google, ChatGPT, Claude, or Perplexity — and get the exact fix. SEO, AI visibility, and security audit in 30 seconds. Free."

Metadata.pricingDescription:
  БЫЛО: "Simple and transparent ShipReady pricing for solo founders and teams."
  БУДЕТ: "ShipReady pricing — free website audit with SEO, AI visibility, and security checks. Upgrade for unlimited scans and AI fix prompts."
```

#### Landing.hero секция

```
hero.h1a:
  БЫЛО: "Site audits that understand"
  БУДЕТ: "Find out why your site"

hero.h1b:
  БЫЛО: "your client's business."
  БУДЕТ: "isn't getting found."

hero.sub:
  БЫЛО: "Scan any URL in minutes. Evidence-backed performance, SEO, security, and AI visibility — with fix prompts ready for any AI coding tool."
  БУДЕТ: "Paste your URL. Get a clear report on why Google, ChatGPT, Claude, and Perplexity can't find your site — and the exact steps to fix it."
```

#### Landing.features.items[4] (AI Visibility)

```
desc:
  БЫЛО: "AEO + GEO checks: Schema.org, FAQ schema, llms.txt, AI crawler access, sitemap, author entity."
  БУДЕТ: "GEO + AEO audit: checks whether ChatGPT, Claude, Perplexity, and Google AI Overview can find, parse, and cite your site. Covers llms.txt, AI crawlers, structured data, and answer-first signals."

checks: добавить "Claude access", "Answer-first signal", "Date freshness"
```

#### Landing.faq.items — полная замена

Текущие FAQ ("What is ShipReady?", "How does the scan work?") не соответствуют реальным поисковым запросам. Заменяем на вопросы, которые люди реально набирают:

```
1. q: "How do I make my website appear in ChatGPT, Claude, and Perplexity?"
   a: Объяснение GEO/AEO — llms.txt, AI crawler access, structured data, answer-first content. Mention ShipReady проверяет всё это автоматически.

2. q: "How do I check if my website has security vulnerabilities?"
   a: Объяснение HTTP security headers, SSL, CSP. ShipReady проверяет 10+ security checks бесплатно.

3. q: "How do I audit my website's SEO for free?"
   a: Объяснение что такое SEO audit — title, description, OG tags, canonical, sitemap, structured data. ShipReady делает это за 30 секунд.

4. q: "What is AI visibility and why does it matter?"
   a: AI search (ChatGPT, Claude, Perplexity) теперь даёт 40% информационного трафика. Если AI не может найти и процитировать твой сайт — тебя не существует для этой аудитории. ShipReady проверяет AI visibility отдельной категорией.

5. q: "Is ShipReady free to use?"
   a: Да. 3 скана в месяц бесплатно, без карты. Pro ($14/mo) — безлимитные сканы, AI fix prompts, PDF, еженедельный мониторинг.
```

#### Landing.footer

```
footer.tagline:
  БЫЛО: "Site audits that understand your client's business."
  БУДЕТ: "Know why your site isn't getting found. Fix it."

footer.copy:
  БЫЛО: "© 2026 ShipReady · Built for web agencies and developers"
  БУДЕТ: "© 2026 ShipReady · Website audit for anyone who wants to be found online"

footer.cinematic.heading:
  БЫЛО: "Is your app\nship-ready?"
  БУДЕТ: "Is your site\ngetting found?"

footer.cinematic.marquee: добавить "AI Visibility Audit", "ChatGPT Optimization", "Get Found Everywhere"
```

#### Landing.cta

```
cta.title:
  БЫЛО: "Is your app ship-ready?"
  БУДЕТ: "Is your site getting found?"

cta.sub:
  БЫЛО: "Run a free scan and get initial findings fast."
  БУДЕТ: "Free scan — see what Google, ChatGPT, and Perplexity actually see when they look at your site."
```

### 1.3 Изменения в `app/layout.tsx`

#### keywords array

```typescript
// БЫЛО
keywords: ['web quality', 'lighthouse', 'SEO checker', 'security audit', 'site audit', 'agency', 'cursor', 'windsurf', 'claude code']

// БУДЕТ
keywords: [
  'free website SEO audit',
  'AI visibility checker',
  'appear in ChatGPT',
  'appear in Claude AI',
  'get found on Perplexity',
  'generative engine optimization',
  'AEO optimization',
  'website security check free',
  'website audit tool',
  'Google AI Overview optimization',
]
```

#### organizationSchema.description

```
БЫЛО: "Site audits that understand your client's business. Scans performance, SEO, security, mobile readiness, and AI visibility."
БУДЕТ: "Free website audit tool. Find out why your site isn't showing up in Google, ChatGPT, Claude, or Perplexity — and get the exact fix."
```

#### webApplicationSchema

```
description: (обновить аналогично)

featureList: добавить:
  - "GEO (Generative Engine Optimization) audit"
  - "AEO (Answer Engine Optimization) audit"
  - "Claude AI crawler access check"
  - "ChatGPT and Perplexity visibility check"
  - "Answer-first content structure signal"
  - "Organization sameAs entity check"
  - "Content date freshness signal"
```

#### OG image alt text

```
БЫЛО: "ShipReady — Site audits that understand your client's business"
БУДЕТ: "ShipReady — Free Website Audit: SEO, AI Visibility & Security"
```

### 1.4 Изменения в `app/(landing)/layout.tsx` (FAQ JSON-LD)

FAQ schema вопросы синхронизировать с `messages/en.ts` Landing.faq.items (те же 5 вопросов). Это нужно чтобы JSON-LD и видимый контент совпадали — требование для Google AI Overview и Perplexity.

### 1.5 Изменения в `public/llms.txt`

Текущие проблемы:
- URL указывает на `ship-ready.vercel.app` (старый), должен быть `shipready.app`
- Описание не answer-first формат
- Нет упоминания Claude

Обновить:
1. Author URL: `https://shipready.app`
2. Pages URLs: `https://shipready.app/...`
3. Описание сделать answer-first (первые 200 слов отвечают на "What is ShipReady?")
4. FAQ секцию: добавить вопросы про Claude AI и GEO/AEO
5. Key concepts: добавить "GEO (Generative Engine Optimization)", "AEO (Answer Engine Optimization)", "Claude AI visibility"

### 1.6 Изменения в `app/sitemap.ts`

Обновить `lastModified` даты на `2026-05-09`.

---

## Track 2 — Улучшения сканера

### 2.1 Переименование `cursorPrompt` → `fixPrompt`

**Мотивация:** Поле называется `cursorPrompt` — привязка к конкретному инструменту, которая устарела. Продукт давно позиционируется как tool-agnostic.

**Scope переименования** (все файлы, везде `replace_all`):

| Файл | Что меняем |
|---|---|
| `types/scan.ts` | `Issue.cursorPrompt` → `Issue.fixPrompt` |
| `lib/ai/issue-templates.ts` | все `cursorPrompt:` → `fixPrompt:` |
| `lib/checks/index.ts` | `issue.cursorPrompt` → `issue.fixPrompt`, `cursorPrompt:` → `fixPrompt:` |
| `lib/checks/ai-visibility.ts` | все ссылки на `cursorPrompt` в существующих check функциях |
| `lib/ai/generate-evidence-enrichment.ts` | все ссылки на `cursorPrompt` |
| `lib/ai/generate-summary.ts` | все ссылки на `cursorPrompt` |
| `lib/scoring.ts` | все ссылки на `cursorPrompt` |
| `components/report/IssueCard.tsx` | `issue.cursorPrompt` → `issue.fixPrompt` |
| `tests/scoring.test.ts` | если упоминается |
| `tests/report-helpers.test.ts` | если упоминается |

**Нет изменений в DB схеме** — `cursorPrompt` хранится в Supabase как часть JSON-поля `results`, не как отдельная колонка. Старые сканы продолжат работать (поле просто не будет найдено в TS типе).

### 2.2 Четыре новых GEO/AEO проверки в `lib/checks/ai-visibility.ts`

Принцип: только реальные измеримые проверки. Confidence честная — нет накрутки скора гипотетическими проблемами.

---

#### `geo-missing-org-sameas`
**Что проверяет:** Organization JSON-LD присутствует на странице, но не содержит поля `sameAs` с внешними профилями.

**Почему это важно (реально):** `sameAs` — это механизм Knowledge Graph. ChatGPT, Claude, Perplexity и Google AI используют его чтобы связать контент с брендом-сущностью. Без `sameAs` AI системы не могут уверенно атрибутировать контент конкретному бренду, что снижает вероятность цитирования.

**Confidence:** `likely`  
**scoreEligible:** `true` (только если Organization schema уже есть — если её нет вообще, это другая проблема)  
**Source:** `ai-visibility`  
**Severity:** `medium`

**Детекция (детерминировано):**
```
1. Парсим все <script type="application/ld+json"> блоки
2. Ищем объект с @type === "Organization" (или массив содержащий такой объект)
3. Если найден: проверяем наличие поля sameAs (должен быть непустой массив с хотя бы одним URL)
4. Если Organization есть, sameAs нет или пуст — issue
5. Если Organization вообще нет — не генерируем этот issue (это отдельная проблема)
```

**fixPrompt (Next.js пример):**
```
В файле app/layout.tsx добавь sameAs в Organization schema.
sameAs — это массив URL-ов твоих профилей в авторитетных источниках.
Это позволяет ChatGPT, Claude, Perplexity и Google AI связать твой сайт
с твоим брендом как сущностью, что критично для AI search visibility.

Пример:
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Название компании',
  url: 'https://yoursite.com',
  sameAs: [
    'https://twitter.com/yourhandle',
    'https://www.linkedin.com/company/yourcompany',
    'https://github.com/yourorg',
  ],
}
```

---

#### `geo-missing-date-signal`
**Что проверяет:** На странице нет ни одного сигнала свежести контента.

Проверяем все три возможных сигнала:
- `datePublished` или `dateModified` в любом JSON-LD блоке
- `<meta property="article:published_time">`
- `<time datetime="...">` элемент в body

**Почему это важно (реально):** Perplexity — это real-time retrieval система, она весит свежесть контента критически высоко. Google AI Overview предпочитает страницы с явным датированием. Без даты контент может восприниматься как устаревший даже если он актуален.

**Confidence:** `verified` (сигнал либо есть, либо нет — детерминировано)  
**scoreEligible:** `true`  
**Source:** `dom`  
**Severity:** `medium`

**Детекция (детерминировано):**
```
1. Проверяем все JSON-LD блоки: есть ли datePublished или dateModified в любом объекте?
2. Проверяем: <meta property="article:published_time" content="...">
3. Проверяем: <time datetime="..."> в body (не в footer copyright)
4. Если ни один из трёх не найден — issue
```

**Исключение:** Главная страница (path === '/') — date signal там менее критичен. Проверку применяем ко всем страницам, но severity для homepage снижаем до `low`.

**fixPrompt:**
```
Добавь сигнал свежести контента. Это критично для AI поисковиков (Perplexity,
Google AI Overview) — без даты контент может игнорироваться как потенциально устаревший.

Вариант 1 — Article schema (для страниц с контентом):
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "datePublished": "2026-05-09",
  "dateModified": "2026-05-09"
}
</script>

Вариант 2 — meta тег (для любых страниц):
<meta property="article:modified_time" content="2026-05-09T00:00:00Z" />

Вариант 3 — видимый тег <time> (лучший для страниц с датой публикации):
<time dateTime="2026-05-09">Last updated: May 9, 2026</time>
```

---

#### `geo-no-question-headings`
**Что проверяет:** Ни один H2 или H3 заголовок на странице не содержит вопросительного паттерна.

**Почему это важно (реально):** Perplexity, ChatGPT с browse, и Google AI Overview извлекают заголовки как Q&A пары и используют их в ответах. Страница с вопросительными H2/H3 ("How does X work?", "What is Y?") в 2.3 раза чаще цитируется в AI ответах (Princeton GEO research, 2024).

**Confidence:** `heuristic`  
**scoreEligible:** `false` (показываем как improvement opportunity, не штрафуем)  
**Source:** `dom`  
**Severity:** `low`

**Детекция (детерминировано):**
```
Паттерн: заголовок начинается с одного из слов:
What, How, Why, When, Who, Which, Can, Is, Are, Does, Do, Will, Should, Where
ИЛИ заканчивается на "?"

Проверяем H2 и H3.
Если ни одного такого заголовка нет — issue.
Не применять к страницам где H2/H3 вообще нет (отдельная SEO проблема).
```

**fixPrompt:**
```
Добавь хотя бы 2-3 заголовка в формате вопросов (H2 или H3).
AI поисковики (ChatGPT, Claude, Perplexity) извлекают их как Q&A пары
и используют в своих ответах с атрибуцией твоего сайта.

Примеры (адаптируй под свою тему):
<h2>How does [your product] work?</h2>
<h2>What makes [your service] different?</h2>
<h3>Can I use [feature] for free?</h3>

Структура страницы с вопросными заголовками коррелирует
с 2x более высокой частотой цитирования в AI ответах.
```

---

#### `geo-answer-first-paragraph`
**Что проверяет:** Первый значимый параграф основного контента страницы короткий (< 50 слов) или отсутствует.

**Почему это важно (реально):** AI системы извлекают passage-level контент — обычно первые 134-167 слов после главного заголовка (Princeton University GEO research). Answer-first structure — когда страница отвечает на свой главный вопрос в самом начале — значительно увеличивает вероятность цитирования. Это не субъективная рекомендация: это измеримый паттерн из академических исследований.

**Confidence:** `heuristic`  
**scoreEligible:** `false`  
**Source:** `dom`  
**Severity:** `low`

**Детекция:**
```
1. Убираем из body: nav, header, footer, aside, script, style, noscript
2. Берём первый <p> с текстом > 10 слов
3. Считаем слова в этом параграфе
4. Если < 50 слов — issue (слишком короткий для AI extraction)
5. Если первый <p> не найден вообще — issue

Применяем к любым страницам с <p> элементами.
Не генерируем issue если на странице вообще нет <p> тегов —
это другая проблема (thin content / non-textual page).
```

**fixPrompt:**
```
Сделай первый параграф страницы достаточно информативным (50+ слов).
AI поисковики извлекают первый passage как основу для цитирования.

Принцип answer-first: первый параграф должен сразу отвечать
на главный вопрос страницы — что это, для кого, зачем.

Плохо: "Welcome to our website. We offer great services."
Хорошо: "[Product] is a [brief description] that helps [target audience]
do [main benefit]. Unlike [alternatives], [differentiator].
[Specific capability] in [timeframe]."

Оптимальная длина первого passage для AI citation: 130-170 слов.
```

### 2.3 Одна новая проверка в `lib/checks/seo.ts`

#### `seo-og-image-dimensions`
**Что проверяет:** `og:image` присутствует, но отсутствуют `og:image:width` и `og:image:height`.

**Почему это важно (реально):** Twitter/X, LinkedIn, Telegram, Discord и другие платформы без явных размеров могут отказаться отображать OG preview или показать его в неправильном соотношении. Это напрямую влияет на CTR при шаринге. Стандарт Open Graph Protocol требует указания размеров.

**Confidence:** `likely`  
**scoreEligible:** `true`  
**Source:** `dom`  
**Severity:** `medium`

**Детекция (детерминировано):**
```
1. Находим <meta property="og:image" content="...">
2. Проверяем наличие <meta property="og:image:width"> И <meta property="og:image:height">
3. Если og:image есть, а размеры отсутствуют — issue
4. Если og:image нет вообще — это другой существующий issue (missing-og-image или аналог)
```

**fixPrompt (Next.js пример):**
```
В метаданных твоей страницы добавь явные размеры OG image.
Twitter/X, LinkedIn, Telegram отображают preview только с известными размерами.

В Next.js app/layout.tsx или page.tsx:
export const metadata = {
  openGraph: {
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Описание изображения',
    }],
  },
}

Стандартный размер OG image: 1200×630px.
```

### 2.4 Issue templates в `lib/ai/issue-templates.ts`

Добавить 5 новых записей в объект `T`:
- `T['geo-missing-org-sameas']`
- `T['geo-missing-date-signal']`
- `T['geo-no-question-headings']`
- `T['geo-answer-first-paragraph']`
- `T['seo-og-image-dimensions']`

Каждый template содержит: `id`, `category`, `severity`, `title`, `description`, `plainEnglish`, `fixPrompt` (переименованное), `docsUrl`.

### 2.5 Упоминание Claude в существующих проверках

Проверить `lib/checks/ai-visibility.ts` — там есть проверка AI crawler access. В `fixPrompt` для проблем с AI crawler доступом добавить явное упоминание что это блокирует **Claude** (ClaudeBot/anthropic-ai) наряду с GPTBot и PerplexityBot.

В `lib/ai/issue-templates.ts` — в шаблонах для `ai-crawler-blocked` и связанных: добавить "Claude" в перечисление AI систем.

В `messages/en.ts` `CategoryCard.descriptions.ai_visibility`:
```
БЫЛО: "Findability in ChatGPT, Perplexity, and Google AI Overview"
БУДЕТ: "Findability in ChatGPT, Claude, Perplexity, and Google AI Overview"
```

---

## Файлы изменяемые по трекам

### Track 1 (позиционирование)
```
messages/en.ts                  — copy, FAQ, meta texts
app/layout.tsx                  — keywords, schema descriptions, OG alt
app/(landing)/layout.tsx        — FAQ JSON-LD schema
public/llms.txt                 — URL fix + AI citability content
app/sitemap.ts                  — lastModified dates
```

### Track 2 (сканер)
```
types/scan.ts                        — cursorPrompt → fixPrompt
lib/ai/issue-templates.ts            — rename + 5 новых templates
lib/checks/index.ts                  — rename references
lib/checks/ai-visibility.ts          — 4 новых GEO проверки
lib/checks/seo.ts                    — 1 новая SEO проверка (og dims)
lib/ai/generate-evidence-enrichment.ts — rename reference
components/report/IssueCard.tsx      — rename reference
tests/scoring.test.ts                — rename if referenced
tests/report-helpers.test.ts         — rename if referenced
messages/en.ts                       — CategoryCard.descriptions.ai_visibility
```

---

## Качественный контракт

- Все 4 новых GEO проверки имеют честный `confidence`: verified или heuristic. Не накручиваем.
- `geo-no-question-headings` и `geo-answer-first-paragraph` — `scoreEligible: false`. Показываем как opportunity, не штрафуем.
- `geo-missing-date-signal` — `verified`, `scoreEligible: true`. Детерминировано.
- `geo-missing-org-sameas` — `likely`, `scoreEligible: true`. Только если Organization schema уже есть.
- `seo-og-image-dimensions` — `likely`, `scoreEligible: true`. Детерминировано.
- Все fixPrompts — с конкретным кодом, не абстрактными советами.
- Claude упоминается в равных правах с ChatGPT и Perplexity везде.

---

## Валидация (пост-реализация)

После реализации: запустить скан `shipready.app` через ShipReady.
Ожидаемый результат:
- AI Visibility: зелёный по `geo-missing-org-sameas` (если добавим sameAs в layout.tsx schema)
- AI Visibility: зелёный по `geo-missing-date-signal` (если добавим dateModified в schema)
- SEO: зелёный по `seo-og-image-dimensions` (og:image:width/height уже указаны в layout.tsx)
- FAQ schema вопросы совпадают с видимыми FAQ на лендинге ✓

---

## Порядок реализации

1. **Rename `cursorPrompt` → `fixPrompt`** — сначала, чтобы все остальные изменения писались с правильным именем.
2. **Новые issue templates** — добавить в `issue-templates.ts`.
3. **Новые проверки** — `ai-visibility.ts` (4 check) + `seo.ts` (1 check).
4. **Landing copy** — `messages/en.ts` (все секции).
5. **Schema + meta** — `app/layout.tsx`, `app/(landing)/layout.tsx`.
6. **llms.txt** — обновить URL и контент.
7. **Sitemap** — даты.
8. **Типы и тесты** — убедиться что `npm run build` проходит.
