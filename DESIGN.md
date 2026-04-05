# DESIGN

> Framer-inspired дизайн-система. Читать при работе над любым UI компонентом.

---

## Цвета (globals.css)

```css
:root {
  --bg-primary:    #0E0E0F;   /* основной фон */
  --bg-secondary:  #161618;   /* карточки */
  --bg-tertiary:   #1E1E21;   /* hover, промпт-блоки */
  --bg-elevated:   #232328;   /* модалки */

  --border-subtle:  rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --border-strong:  rgba(255,255,255,0.18);

  --text-primary:   #F1F0EE;
  --text-secondary: #8B8A85;
  --text-tertiary:  #5A5955;
  --text-code:      #E8C77D;

  --critical:        #FF4444;  --critical-bg: rgba(255,68,68,0.08);
  --high:            #FF8C42;  --high-bg:     rgba(255,140,66,0.08);
  --medium:          #F5C518;  --medium-bg:   rgba(245,197,24,0.08);
  --low:             #4A9EFF;  --low-bg:      rgba(74,158,255,0.08);
  --pass:            #3DDC84;  --pass-bg:     rgba(61,220,132,0.08);

  --accent:          #6E56CF;
  --accent-hover:    #7C68D4;
}
```

## Tailwind config

```typescript
extend: {
  colors: {
    bg: { primary:'#0E0E0F', secondary:'#161618', tertiary:'#1E1E21' },
    severity: { critical:'#FF4444', high:'#FF8C42', medium:'#F5C518', low:'#4A9EFF', pass:'#3DDC84' },
    accent: '#6E56CF',
  },
  fontFamily: {
    sans: ['Geist', 'Inter', 'system-ui'],
    mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
  },
}
```

**Правила:** числа и score — всегда `font-mono`. Severity badges — uppercase, `letter-spacing: 0.08em`. Промпт-блоки — `font-mono`, `bg-tertiary`.

---

## Компоненты

### ScoreRing

```
Размер: 180×180 · Stroke: 8px
Анимация: stroke-dashoffset заполняется за 1200ms
Easing: cubic-bezier(0.34, 1.56, 0.64, 1) — лёгкий overshoot
Центр: число 64px font-mono font-500
Под числом: "SCORE" 11px text-tertiary uppercase letter-spacing 0.08em

Цвет ring: 90–100 → #3DDC84 · 70–89 → #7BC67E · 50–69 → #F5C518 · 0–49 → #FF4444
```

### CategoryCard

```
[иконка] Performance              89 /100   ← font-mono
████████████░░░  Good             ↕ toggle
─────────────────────────────────────────
✓ Core Web Vitals passed                   ← --pass
⚠ LCP is 3.2s — target 2.5s              ← --high цвет

Иконки: Zap / Search / Shield / Smartphone (lucide-react)
```

### IssueCard

```
│ border-left: 2px solid var(--{severity})
│ ● CRITICAL    Open Graph image missing
│
│ When someone shares your link...        ← plainEnglish
│
│ [Fix with Cursor ▾] [Fix with Bolt ▾]  ← expandable
│ ┌────────────────────────────────────┐
│ │ $ Add Open Graph meta tags...      │  ← font-mono bg-tertiary
│ └────────────────────────────────────┘
│ [Copy prompt]  →  [✓ Copied] 2 сек

Free tier: prompt-блок blur(8px) + оверлей "Upgrade to Pro →" (--accent кнопка)
```

### OGPreview

```
Три таба: Twitter/X | Telegram | WhatsApp
Каждый — точная копия native preview card платформы.
Данные: og:title, og:description, og:image из скана.
Если og:image нет → серый placeholder с иконкой ImageOff.

Twitter: 500px, image сверху (2:1), text снизу, border-radius 16px
Telegram: 380px, image слева 72×72, text справа
WhatsApp: 320px, compact, image слева 80px
```

### ScanForm (лендинг)

```
Одна строка h:52px:
[https://your-app.vercel.app__________] [Scan →]

Input: font-mono · bg-secondary · border-default · placeholder текст
Button: bg-accent · text-white · hover bg-accent-hover
Submit: кнопка → spinner (Loader2, animate-spin) · input disabled
```

---

## Страницы

### Landing (/)

```
NAV: ShipReady              [EN|RU]  [Sign in]

HERO (pt-[120px], text-center):
  "Pre-deploy quality gate"     48px font-500
  "for vibe-coded apps"         48px font-500 text-secondary
  "25+ checks · 30 seconds"     18px text-secondary mt-4
  [ScanForm]                    mt-10 max-w-[560px] mx-auto
  Cursor · Bolt · Lovable · v0  grayscale opacity-40 mt-8

DEMO: "Example report ↓"
  [скриншот/живой пример реального отчёта]

PRICING: Free · Pro $14 · Agency $39
  3 карточки, Pro: border 2px --accent, "Most popular" badge
```

### Report (/report/[id])

```
NAV: ShipReady + URL сайта           [Share] [Export PDF]

LOADING (пока status !== 'done'):
  Progress bar + статус: "Checking performance..."
  4 шага: Performance → SEO & Social → Security → Mobile

LOADED:
  [ScoreRing]  +  aiSummary текст (max 3 строки, text-secondary)

  ТАБЫ: Performance [89] · SEO [78] · Security [41] · Mobile [95]
  (активная = underline --accent, числа font-mono)

  Issues: Critical → High → Medium → Low (сортировка)
  [IssueCard × N]

  "How your links appear on social media"
  [OGPreview: Twitter | Telegram | WhatsApp]

  "✓ 18 checks passed" [показать] ← свёрнуто по умолчанию
```

---

## Анимации

```css
/* Score Ring появление */
@keyframes scoreIn {
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1); }
}
.score-ring { animation: scoreIn 400ms ease-out; }

/* CategoryCard stagger */
.category-card:nth-child(1) { animation-delay: 0ms; }
.category-card:nth-child(2) { animation-delay: 80ms; }
.category-card:nth-child(3) { animation-delay: 160ms; }
.category-card:nth-child(4) { animation-delay: 240ms; }

/* IssueCard expand */
.issue-prompts { max-height: 0; overflow: hidden; transition: max-height 300ms ease; }
.issue-prompts.open { max-height: 500px; }
```
