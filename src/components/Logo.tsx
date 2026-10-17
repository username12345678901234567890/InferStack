import { useId } from 'react'

/** Brand gradient, top to bottom: teal → sky → indigo → violet */
export const BRAND_STOPS = ['#0FF0CF', '#1BA6F2', '#5560F4', '#8B2CF5'] as const

/**
 * InferStack mark: three stacked chevrons, one continuous gradient.
 * Reads as a stack of layers moving up — requests climbing the stack.
 */
export function LogoMark({ size = 24, className = '' }: { size?: number; className?: string }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="13" y1="1" x2="19" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={BRAND_STOPS[0]} />
          <stop offset="0.38" stopColor={BRAND_STOPS[1]} />
          <stop offset="0.7" stopColor={BRAND_STOPS[2]} />
          <stop offset="1" stopColor={BRAND_STOPS[3]} />
        </linearGradient>
      </defs>
      <path d="M2 9 L16 1 L30 9 L30 14.2 L16 6.2 L2 14.2 Z" fill={`url(#${id})`} />
      <path d="M2 17.4 L16 9.4 L30 17.4 L30 22.6 L16 14.6 L2 22.6 Z" fill={`url(#${id})`} />
      <path d="M2 25.8 L16 17.8 L30 25.8 L30 31 L16 23 L2 31 Z" fill={`url(#${id})`} />
    </svg>
  )
}

export function Logo({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={'flex w-fit items-center gap-2 ' + className}>
      <LogoMark size={size} />
      {/* 1px down: optically centers the caps on the mark and puts the baseline on the nav baseline */}
      <span className="relative top-px text-[17px] font-semibold tracking-[-0.02em] text-fg">InferStack</span>
    </span>
  )
}
