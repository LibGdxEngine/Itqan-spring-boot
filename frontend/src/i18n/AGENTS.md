<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# i18n

## Purpose
Internationalization configuration for next-intl. Handles locale detection from cookies and loads appropriate translation messages.

## Key Files

| File | Description |
|------|-------------|
| `request.ts` | next-intl server configuration — locale detection from cookies, supports EN and AR |

## For AI Agents

### Working In This Directory
- Supported locales: `en` (English) and `ar` (Arabic with RTL)
- Locale is detected from cookies
- Translation files live in `frontend/messages/` (`en.json`, `ar.json`)
- Use `useTranslations('namespace')` hook in client components
- Use `getTranslations('namespace')` in server components

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
