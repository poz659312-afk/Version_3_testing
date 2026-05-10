import * as React from "react"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "dotlottie-player": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string
          background?: string
          speed?: string | number
          direction?: string | number
          playMode?: string
          loop?: boolean
          autoplay?: boolean
          hover?: boolean
          interactMode?: string
          renderer?: string
        },
        HTMLElement
      >
    }
  }
}
