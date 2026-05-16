// [PERF] NoMotionProvider has been eliminated.
// Previously imported framer-motion's MotionConfig (~45kB),
// polluting the shared chunk. Now a zero-cost passthrough.
import React from "react"

export default function NoMotionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
