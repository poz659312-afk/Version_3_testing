import React from 'react'

const FRAMER_PROPS = new Set([
  'initial','animate','exit','transition','whileHover','whileTap','whileInView','variants','custom','viewport','key','layout','layoutId','style','transitionEnd','whileFocus','whileDrag','onAnimationComplete'
])

function createMotionComponent(tag: any) {
  const Comp = React.forwardRef(({ children, ...props }: any, ref: any) => {
    const cleanProps: any = {}
    for (const k in props) {
      if (!FRAMER_PROPS.has(k)) cleanProps[k] = props[k]
    }
    return React.createElement(tag, { ref, ...cleanProps }, children)
  })
  Comp.displayName = `Motion.${String(tag)}`
  return Comp
}

const motion = new Proxy({}, {
  get: (_target, prop: string) => {
    // support motion.div, motion.span, etc.
    return createMotionComponent(prop)
  }
}) as any

export const AnimatePresence = ({ children }: any) => {
  return React.createElement(React.Fragment, null, children)
}

export const MotionConfig = ({ children }: any) => {
  return React.createElement(React.Fragment, null, children)
}

export { motion }
export default motion
