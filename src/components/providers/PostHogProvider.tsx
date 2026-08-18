'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()

  useEffect(() => {
    if (pathname && ph) {
      let url = window.origin + pathname
      if (searchParams.toString()) url += `?${searchParams.toString()}`
      ph.capture('$pageview', { $current_url: url })
    }
  }, [pathname, searchParams, ph])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false, // handled manually via PostHogPageView
      capture_pageleave: true,
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      {/* PostHogPageView calls useSearchParams, which makes Next bail its
          closest Suspense boundary out of server rendering on statically
          generated pages. It MUST have its own boundary — when it shared one
          with {children} the entire app rendered client-side, so restaurant
          and list pages reached crawlers with no <h1>, no tags and no content.
          Do not hoist this Suspense to wrap children. */}
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}
