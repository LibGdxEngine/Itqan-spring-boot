<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# messages

## Purpose
Internationalization translation files for next-intl. Contains all user-facing strings in English and Arabic, organized by feature namespace (common, nav, home, auth, footer, courses, etc.).

## Key Files

| File | Description |
|------|-------------|
| `en.json` | English translations — all UI strings organized by namespace |
| `ar.json` | Arabic translations — mirrors English structure for RTL support |

## For AI Agents

### Working In This Directory
- Both files must stay in sync — every key in `en.json` must exist in `ar.json` and vice versa
- Strings are organized by namespace (e.g., `common`, `nav`, `home`, `auth`, `footer`)
- Use `next-intl` `useTranslations('namespace')` hook in components to access strings
- Arabic text must be properly written — do not use machine translation placeholders

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
