import { useEffect } from 'react';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from './theme-context';

const capture: { ref?: ReturnType<typeof useTheme> } = {};

function Consumer() {
  const themeContext = useTheme();
  useEffect(() => {
    capture.ref = themeContext;
  }, [themeContext]);
  return null;
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.removeItem('golf-theme');
    document.documentElement.className = '';
    capture.ref = undefined;
  });

  it('defaults to dark and adds the dark class', () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    expect(capture.ref).toBeDefined();
    expect(capture.ref?.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles between dark and light and persists selection', () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    act(() => {
      capture.ref?.toggleTheme();
    });
    expect(capture.ref?.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('golf-theme')).toBe('light');
    act(() => {
      capture.ref?.setTheme('dark');
    });
    expect(capture.ref?.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
