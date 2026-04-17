# Frontend Tests

## Running tests

```bash
# Watch mode (interactive)
npm run test

# One-shot run (CI)
npm run test:run

# With coverage
npm run test:coverage
```

## Writing tests

Tests live alongside source files in `__tests__` folders:
- `src/components/foo/__tests__/foo.test.tsx`
- `src/lib/__tests__/utils.test.ts`

Use Vitest + React Testing Library + `@testing-library/jest-dom` matchers.
Mocks for `next/navigation` and `next-intl` are set up in `src/test/setup.ts`.
