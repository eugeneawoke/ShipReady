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

### E-02: Текущий scan pipeline ещё не отделяет failed measurement от healthy result
Дата: 2026-04-08
Факт: `runAllChecks()` подставляет нулевые Lighthouse metrics при timeout/error, а scoring логика не создаёт performance issues для `0`-значений и не маркирует measurement как unavailable.
Проверено: чтение [`lib/checks/index.ts`](/Users/eugene.gusakov/Documents/self-projects/ShipReady/lib/checks/index.ts) и [`lib/scoring.ts`](/Users/eugene.gusakov/Documents/self-projects/ShipReady/lib/scoring.ts)

### E-03: В security path есть лишний fetch и последовательные probes
Дата: 2026-04-08
Факт: `runSecurityChecks()` повторно делает `fetch(url)` для headers и затем проверяет `/.env*` файлы последовательно в цикле.
Проверено: чтение [`lib/checks/security.ts`](/Users/eugene.gusakov/Documents/self-projects/ShipReady/lib/checks/security.ts)

---

## На проверке (гипотезы → после проверки перенести выше)

- [ ] @sparticuz/chromium работает на Vercel с `maxDuration:60, memory:3009`
- [ ] `ssl-checker` npm корректно возвращает `daysRemaining`
- [ ] `fetch('/.env')` с `AbortSignal.timeout(3000)` не вешает скан при timeout
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
