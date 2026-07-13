'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function useTheme() {
  const { theme, setTheme, ...rest } = useNextTheme()

  const setThemeWithTransition = React.useCallback((newTheme: string) => {
    if (
      typeof window === 'undefined' ||
      !document.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setTheme(newTheme)
      return
    }

    // Set up a promise that resolves when next-themes changes the class on the html element.
    // This allows React and next-themes to update the DOM asynchronously,
    // and the browser will wait to capture the "new" snapshot until the theme class is applied.
    let resolveTransition: () => void = () => {};
    const classChangedPromise = new Promise<void>((resolve) => {
      resolveTransition = resolve;
    });

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          resolveTransition()
          observer.disconnect()
          break
        }
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    // Fail-safe to avoid hanging transition
    const timeoutId = setTimeout(() => {
      resolveTransition()
      observer.disconnect()
    }, 250)

    document.startViewTransition(async () => {
      setTheme(newTheme)
      await classChangedPromise
      clearTimeout(timeoutId)
    })
  }, [setTheme])

  return {
    theme,
    setTheme: setThemeWithTransition,
    ...rest
  }
}

