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

---

## На проверке (гипотезы → после проверки перенести выше)

- [ ] @sparticuz/chromium работает на Vercel с `maxDuration:60, memory:3009`
- [ ] `ssl-checker` npm корректно возвращает `daysRemaining`
- [ ] `fetch('/.env')` с `AbortSignal.timeout(3000)` не вешает скан при timeout
- [ ] Lemon Squeezy webhook передаёт `custom_data.user_id` корректно
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
