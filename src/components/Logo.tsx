import { useId } from 'react'

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={`g${id}`} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#608aff" />
          <stop offset=".55" stopColor="#3b63fb" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path d="M8 40.5 32 53l24-12.5" stroke={`url(#g${id})`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity=".45" />
      <path d="M8 30.5 32 43l24-12.5" stroke={`url(#g${id})`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity=".75" />
      <path d="M32 6 56 18.5 32 31 8 18.5Z" fill={`url(#g${id})`} />
      <path d="M32 12.5 37.5 18.5 32 24.5 26.5 18.5Z" className="fill-white dark:fill-[#0b1020]" />
    </svg>
  )
}

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span className={'inline-flex items-center gap-2 ' + (className ?? '')}>
      <LogoMark size={size} />
      <span className="text-[17px] font-extrabold tracking-tight">
        Infer<span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent dark:from-brand-400 dark:to-accent-400">Stack</span>
      </span>
    </span>
  )
}
