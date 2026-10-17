import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { MODELS } from '../data/models'
import { GPUS } from '../data/architectures'
import { OrgAvatar } from '../components/ModelBits'
import { Badge, Button, Card, PageHeader } from '../components/ui'
import { fmtCtx, fmtPrice } from '../lib/format'

export default function Pricing() {
  const plans = [
    { name: '무료', price: '$0', desc: '가입만 하면 바로', features: ['무료 티어 모델 (분당 20회)', '가입 보너스 $5 크레딧', '플레이그라운드', '커뮤니티 지원'], cta: '시작하기', to: '/signin' },
    { name: '종량제', price: '토큰당', desc: '쓴 만큼만', features: ['36+ 모델 전체 이용', '속도 제한 완화', 'API 키별 한도/권한', '커스텀 모델 배포', '자동 충전'], cta: '크레딧 충전', to: '/credits', hi: true },
    { name: '엔터프라이즈', price: '문의', desc: '대규모 트래픽', features: ['전용 GPU 예약 용량', '볼륨 할인', 'SSO · 감사 로그', 'VPC 피어링 / 온프레미스', '99.9% SLA'], cta: '영업팀 문의', to: '/docs' },
  ]
  return (
    <div>
      <PageHeader title="가격" description="구독 없이 사용한 토큰만큼만. 모든 가격은 USD / 100만 토큰 기준입니다." />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className={p.hi ? 'relative border-fg/40 p-6 ring-1 ring-fg/10' : 'p-6'}>
            {p.hi && <Badge color="brand" className="absolute right-4 top-4">인기</Badge>}
            <div className="font-semibold">{p.name}</div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{p.price}</div>
            <div className="text-sm text-slate-500">{p.desc}</div>
            <ul className="mt-5 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2"><Check size={15} className="text-emerald-500" /> {f}</li>
              ))}
            </ul>
            <Link to={p.to}><Button className="mt-6 w-full" variant={p.hi ? 'primary' : 'outline'}>{p.cta}</Button></Link>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-12 text-lg font-semibold">모델별 토큰 가격</h2>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr className="border-b border-slate-200 dark:border-white/10">
              <th className="px-4 py-3 font-medium">모델</th>
              <th className="px-3 py-3 font-medium">컨텍스트</th>
              <th className="px-3 py-3 text-right font-medium">입력</th>
              <th className="px-3 py-3 text-right font-medium">캐시 입력</th>
              <th className="px-3 py-3 text-right font-medium">출력</th>
            </tr>
          </thead>
          <tbody>
            {[...MODELS].sort((a, b) => a.orgName.localeCompare(b.orgName)).map((m) => (
              <tr key={m.slug} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                <td className="px-4 py-2.5">
                  <Link to={`/models/${m.slug}`} className="flex items-center gap-2 hover:text-fg">
                    <OrgAvatar org={m.org} name={m.orgName} size={20} /> {m.name} {m.free && <Badge color="green">무료 티어</Badge>}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-slate-500">{fmtCtx(m.context)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmtPrice(m.price.input)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-500">{fmtPrice(m.price.cachedInput ?? 0)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmtPrice(m.price.output)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="mb-3 mt-12 text-lg font-semibold">커스텀 모델 GPU 가격</h2>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr className="border-b border-slate-200 dark:border-white/10">
              <th className="px-4 py-3 font-medium">GPU</th>
              <th className="px-3 py-3 font-medium">VRAM</th>
              <th className="px-3 py-3 text-right font-medium">시간당</th>
              <th className="px-3 py-3 text-right font-medium">초당</th>
            </tr>
          </thead>
          <tbody>
            {GPUS.map((g) => (
              <tr key={g.id} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                <td className="px-4 py-2.5 font-medium">{g.name}</td>
                <td className="px-3 py-2.5 text-slate-500">{g.vram} GB</td>
                <td className="px-3 py-2.5 text-right font-mono">${g.price.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-500">${(g.price / 3600).toFixed(5)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-white/10">비공개 엔드포인트는 레플리카가 실행 중인 시간만 초 단위로 과금됩니다. 마켓플레이스 공개 모델은 GPU 비용 대신 호출자 토큰 매출의 80%를 정산받습니다.</div>
      </Card>
    </div>
  )
}
