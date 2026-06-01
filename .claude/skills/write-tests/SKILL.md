---
noteId: "fa33dc40542211f1aa4195a423e6fe30"
tags: []
name: "write-tests"
description: "Write Vitest + React Testing Library unit tests for the ReactAPP widget project. This project is React 19 + Vite — no test runner is configured yet; this skill includes setup instructions. Use whenever the user asks to write tests, add test coverage, test a hook or utility, create unit tests, or asks \"how would I test this?\"\n"

---

# Write Tests — ReactAPP Widget

**Stack:** Vitest + React Testing Library + jsdom. React 19 + Vite 8. TypeScript.

> **No test runner is currently configured.** Follow the one-time setup below before writing the
> first test.

---

## One-time setup

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

**`vitest.config.ts`** at project root:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

**`src/test-setup.ts`**:
```ts
import '@testing-library/jest-dom';
```

Add to `package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

**Test file location** — co-locate next to the source:
```
src/utils/analysisUtils.ts       →  src/utils/analysisUtils.test.ts
src/hooks/useAnalysis.ts         →  src/hooks/useAnalysis.test.ts
src/components/AnalysisPanel.tsx →  src/components/AnalysisPanel.test.tsx
```

---

## Before writing anything — read the file

Read the target file completely first. Verify:
- Exact exported function / hook names
- What the function accepts and returns
- Which imports have side effects (services, fetch) that need mocking

---

## Pattern A — Pure utility functions

Pure functions in `src/utils/` have no side effects and need no mocks. Call them directly.

```ts
// analysisUtils.test.ts
import { describe, it, expect } from 'vitest';
import { checkTileText, gatherUrlCandidates } from './analysisUtils';

const PAGE_ID = 'page-1';
const PAGE_NAME = 'Home';

describe('checkTileText', () => {
  it('returns no issues when all tile labels are short enough', () => {
    const block = {
      InfoType: 'TileGrid', InfoId: 'b1',
      Columns: [{ Tiles: [{ Id: 't1', Text: 'Short' }] }],
    };
    expect(checkTileText([block], PAGE_ID, PAGE_NAME)).toHaveLength(0);
  });

  it('flags a tile whose label exceeds the limit for a 3-column grid', () => {
    const block = {
      InfoType: 'TileGrid', InfoId: 'b1',
      Columns: [
        { Tiles: [{ Id: 't1', Text: 'This is way too long for 3 cols' }] },
        { Tiles: [] },
        { Tiles: [] },
      ],
    };
    const issues = checkTileText([block], PAGE_ID, PAGE_NAME);
    expect(issues).toHaveLength(1);
    expect(issues[0].subcategory).toBe('long-text');
    expect(issues[0].blockId).toBe('b1');
  });
});

describe('gatherUrlCandidates', () => {
  it('extracts BGImageUrl from a tile', () => {
    const block = {
      InfoType: 'TileGrid', InfoId: 'b1',
      Columns: [{ Tiles: [{ Id: 't1', Text: 'Tile', BGImageUrl: 'https://example.com/img.png' }] }],
    };
    const candidates = gatherUrlCandidates([block], PAGE_ID, PAGE_NAME);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].url).toBe('https://example.com/img.png');
  });

  it('returns empty array when there are no URL fields', () => {
    const block = { InfoType: 'Description', InfoId: 'b2', InfoValue: 'Hello' };
    expect(gatherUrlCandidates([block], PAGE_ID, PAGE_NAME)).toHaveLength(0);
  });
});
```

---

## Pattern B — Service modules

Service functions in `src/services/` call `apiGet`/`apiPost` from `apiClient.ts`. Mock the module:

```ts
// pagesApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./apiClient', () => ({
  apiPost: vi.fn(),
  apiGet: vi.fn(),
  checkError: vi.fn(),
}));

import { savePage } from './pagesApi';
import { apiPost, checkError } from './apiClient';

describe('savePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls apiPost with the correct endpoint and payload', async () => {
    (apiPost as any).mockResolvedValue({ Message: 'OK' });
    await savePage('page-1', []);
    expect(apiPost).toHaveBeenCalledWith(
      expect.stringContaining('page-1'),
      expect.any(Object),
    );
  });

  it('calls checkError on the response', async () => {
    const response = { Message: 'OK' };
    (apiPost as any).mockResolvedValue(response);
    await savePage('page-1', []);
    expect(checkError).toHaveBeenCalledWith(response);
  });
});
```

---

## Pattern C — Custom hooks

Use `renderHook` from React Testing Library. Wrap state updates in `act()`.

```ts
// useUndoRedo.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from './useUndoRedo';

describe('useUndoRedo', () => {
  it('undo restores the previous snapshot', () => {
    const { result } = renderHook(() => useUndoRedo({ onRestorePages: () => {} }));

    act(() => result.current.pushSnapshot(['page-a']));
    act(() => result.current.pushSnapshot(['page-b']));
    act(() => result.current.undo());

    expect(result.current.pages).toEqual(['page-a']);
  });

  it('redo re-applies the undone snapshot', () => {
    const { result } = renderHook(() => useUndoRedo({ onRestorePages: () => {} }));

    act(() => result.current.pushSnapshot(['page-a']));
    act(() => result.current.pushSnapshot(['page-b']));
    act(() => result.current.undo());
    act(() => result.current.redo());

    expect(result.current.pages).toEqual(['page-b']);
  });

  it('canUndo is false when there is nothing to undo', () => {
    const { result } = renderHook(() => useUndoRedo({ onRestorePages: () => {} }));
    expect(result.current.canUndo).toBe(false);
  });
});
```

For hooks that call service functions, mock the service module:
```ts
vi.mock('../services/pagesApi', () => ({
  savePage: vi.fn().mockResolvedValue({ Message: 'OK' }),
}));
```

---

## Pattern D — React components

Use `render` from React Testing Library. Query by role/text, not CSS class.

```ts
// AnalysisPanel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisPanel } from './AnalysisPanel';

const noop = () => {};

describe('AnalysisPanel', () => {
  it('shows the issue count in the header', () => {
    const issues = [
      { id: '1', category: 1, subcategory: 'invalid-url', pageId: 'p1', pageName: 'Home',
        blockId: 'b1', location: 'Image block', detail: 'Unreachable URL', value: 'https://x.com' },
    ];
    render(<AnalysisPanel issues={issues} isAnalyzing={false} onClose={noop} onRerun={noop} />);
    expect(screen.getByText(/1 issue/i)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<AnalysisPanel issues={[]} isAnalyzing={false} onClose={onClose} onRerun={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows a spinner while analyzing', () => {
    render(<AnalysisPanel issues={[]} isAnalyzing={true} onClose={noop} onRerun={noop} />);
    expect(screen.getByRole('status')).toBeInTheDocument(); // spinner aria role
  });
});
```

---

## What to test in every file

1. **Happy path** — the main use case works
2. **Empty / null inputs** — `[]`, `null`, `undefined`, empty string
3. **Conditional branches** — every `if` that changes behaviour
4. **Error paths** — service throws; API returns unexpected shape
5. **Cleanup** — hook unmounts cleanly; no lingering timers

Do not test implementation details (internal state shape, private helpers). Test observable outputs.

---

## Async hooks with timers (useAnalysis, useAutoSave)

These hooks use `setTimeout` debounces. Use Vitest's fake timers:

```ts
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

it('fires the slow URL scan after 4 seconds', async () => {
  const { result } = renderHook(() => useAnalysis({ ... }));
  act(() => { vi.advanceTimersByTime(4000); });
  await vi.runAllTimersAsync();
  expect(result.current.isAnalyzing).toBe(false);
});
```

---

## Running tests

```bash
npm test            # watch mode
npm run test:run    # single pass
npm run test:coverage  # with coverage report
```
