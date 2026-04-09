# EVIDENCE

> Только подтверждённые факты — не гипотезы.
> Добавлять после реальной проверки. Агент не перепроверяет то что здесь есть.
> Сырые outputs → в logs/, здесь только summary и вывод.

---

## Подтверждённые факты

### E-01: Lint и production build проходят после hardening scan pipeline
Дата: 2026-04-08
Факт: `npm run lint` и `npm run build` проходят на текущем коде после фиксов scan pipeline, RLS access model и report polling flow.
Проверено: `npm run lint`, `npm run build`

### E-02: [устарело] Старый scan pipeline не отделял failed measurement от healthy result
Дата: 2026-04-08
Факт: было верно до quality overhaul. Сейчас `runAllChecks()` сохраняет measurement status, а performance score становится `null` при unavailable Lighthouse measurement.
Проверено: чтение [`lib/checks/index.ts`](/Users/eugene.gusakov/Documents/self-projects/ShipReady/lib/checks/index.ts) и [`lib/scoring.ts`](/Users/eugene.gusakov/Documents/self-projects/ShipReady/lib/scoring.ts)

### E-03: [устарело] В security path был лишний fetch и последовательные probes
Дата: 2026-04-08
Факт: было верно до quality/security hardening. Сейчас `runSecurityChecks()` получает shared headers/context, а sensitive-file probes идут через safe fetch helper.
Проверено: чтение [`lib/checks/security.ts`](/Users/eugene.gusakov/Documents/self-projects/ShipReady/lib/checks/security.ts)

### E-04: Quality Overhaul core реализован в коде
Дата: 2026-04-09
Факт: `types/scan.ts` содержит confidence/evidence/phase/timings/measurement fields; `lib/scoring.ts` считает score только по `scoreEligible`; `lib/checks/index.ts` работает через `running_fast` → `running_deep` → `enriching` → `done`.
Проверено: чтение [`types/scan.ts`](/Users/eugene.gusakov/Documents/self-projects/ShipReady/types/scan.ts), [`lib/scoring.ts`](/Users/eugene.gusakov/Documents/self-projects/ShipReady/lib/scoring.ts), [`lib/checks/index.ts`](/Users/eugene.gusakov/Documents/self-projects/ShipReady/lib/checks/index.ts)

### E-05: Beta security hardening проходит build
Дата: 2026-04-09
Факт: после удаления legacy billing provider, SSRF/CSRF hardening и обновления docs проходят `npm run lint` и `npm run build`.
Проверено: `npm run lint`, `npm run build`

### E-06: Local main ahead of GitHub main
Дата: 2026-04-09
Факт: после `git fetch origin main`, local `main` впереди `origin/main`; GitHub main ещё не содержит последние local fixes/docs. Точное число коммитов нужно перепроверять перед push, потому что текущая docs alignment работа добавляет новый commit.
Проверено: `git rev-list --left-right --count origin/main...HEAD` → `0 4` до текущего docs alignment commit.

---

## На проверке (гипотезы → после проверки перенести выше)

- [ ] @sparticuz/chromium работает на Vercel с `maxDuration:60, memory:3009`
- [ ] `ssl-checker` npm корректно возвращает `daysRemaining`
- [ ] sensitive-file probes через safe fetch helper не вешают скан при timeout
- [ ] Новый billing provider передаёт внутренний `user_id`/customer mapping корректно
- [ ] Supabase RLS не блокирует анонимные inserts в scans
- [ ] `og:image` HEAD request с 4s timeout не вешает SEO check

---

## Формат записи

```
### E-XX: Короткое название
Дата: YYYY-MM-DD
Факт: что подтверждено
Проверено: команда / тест / URL
Лог: logs/XXX.txt (если есть)
```

---

## Известные проблемы и решения

*(заполняется при нахождении)*
