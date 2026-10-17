/**
 * InferStack 마크: 오른쪽으로 한 칸씩 밀려 쌓이는 세 개의 바.
 * 요청 트레이스(워터폴)처럼 읽히고, 마지막 주황 바는 지금 생성 중인 토큰을 뜻한다.
 * 타일은 테마의 반대색(다크 → 흰 타일, 라이트 → 검은 타일).
 */
export function LogoMark({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-fg" />
      <rect x="6" y="8" width="12" height="4" rx="2" className="fill-bg" />
      <rect x="10" y="14" width="12" height="4" rx="2" className="fill-bg" />
      <rect x="14" y="20" width="12" height="4" rx="2" fill="#ff6a1a" />
    </svg>
  )
}

export function Logo({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={'inline-flex items-center gap-2 ' + className}>
      <LogoMark size={size} />
      <span className="text-[18px] font-bold tracking-tightest text-fg">inferstack</span>
    </span>
  )
}
