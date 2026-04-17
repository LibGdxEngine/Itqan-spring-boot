<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-12 | Updated: 2026-04-12 -->

# ui

## Purpose
Base UI component library built on Radix UI primitives, following the shadcn/ui pattern. These are the foundational building blocks for all feature components.

## Key Files

| File | Description |
|------|-------------|
| `button.tsx` | Button with variants (default, outline, ghost, destructive) and sizes |
| `input.tsx` | Form text input |
| `label.tsx` | Form label (Radix Label) |
| `textarea.tsx` | Multi-line text input |
| `card.tsx` | Card container with header, content, footer, title, description |
| `checkbox.tsx` | Checkbox (Radix Checkbox) |
| `dialog.tsx` | Modal dialog (Radix Dialog) |
| `dropdown-menu.tsx` | Dropdown menu (Radix DropdownMenu) |
| `avatar.tsx` | User avatar with image and fallback (Radix Avatar) |
| `alert.tsx` | Alert message with variant styling |
| `accordion.tsx` | Collapsible accordion sections |
| `progress.tsx` | Progress bar (Radix Progress) |
| `separator.tsx` | Visual separator line (Radix Separator) |
| `tooltip.tsx` | Tooltip overlay (Radix Tooltip) |
| `toast.tsx` | Toast notification with action support |
| `use-toast.ts` | Toast hook for programmatic toast creation |
| `language-switcher.tsx` | EN/AR language toggle with cookie-based locale persistence |

## For AI Agents

### Working In This Directory
- Components follow shadcn/ui conventions — Radix primitives + Tailwind styling
- Use `class-variance-authority` (cva) for component variants
- Use `cn()` from `lib/utils.ts` for conditional class merging
- Do not modify the Radix primitive behavior — only style customization
- New UI primitives should follow the same pattern: Radix base + cva variants + forwardRef

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
