import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { MODELS } from '../data/models'
import { GPUS } from '../data/architectures'
import { OrgAvatar } from '../components/ModelBits'
import { Badge, Button, Card, PageHeader } from '../components/ui'
import { fmtCtx, fmtPrice } from '../lib/format'

export default function Pricing() {
  const plans = [
    { name: 'Free', price: '$0', desc: 'Start right after sign-up', features: ['Free-tier models (20 req/min)', '$5 in sign-up credits', 'Playground', 'Community support'], cta: 'Get started', to: '/signin' },
    { name: 'Pay as you go', price: 'Usage-based', desc: 'Billed per token', features: ['All 36+ models', 'Higher rate limits', 'Per-key limits and permissions', 'Custom model deployment', 'Auto top-up'], cta: 'Add credits', to: '/credits', hi: true },
    { name: 'Enterprise', price: 'Custom', desc: 'For high-volume traffic', features: ['Reserved dedicated GPU capacity', 'Volume discounts', 'SSO · audit logs', 'VPC peering / on-prem', '99.9% SLA', 'Invoiced billing'], cta: 'Contact sales', to: '/docs' },
  ]
  return (
    <div>
      <PageHeader title="Pricing" description="No subscription — pay only for the tokens you use. All prices are in USD per 1M tokens." />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className={p.hi ? 'relative border-fg/40 p-6 ring-1 ring-fg/10' : 'p-6'}>
            {p.hi && <Badge color="brand" className="absolute right-4 top-4">Popular</Badge>}
            <div className="font-semibold">{p.name}</div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{p.price}</div>
            <div className="text-sm text-fg3">{p.desc}</div>
            <ul className="mt-5 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2"><Check size={15} className="text-emerald-500" /> {f}</li>
              ))}
            </ul>
            <Link to={p.to}><Button className="mt-6 w-full" variant={p.hi ? 'primary' : 'outline'}>{p.cta}</Button></Link>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-12 text-lg font-semibold">Token pricing by model</h2>
      <Card className="overflow-x-auto">
        <table className="tabular w-full text-[14px]">
          <thead className="text-left text-xs text-fg3">
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-3 py-3 font-medium">Context</th>
              <th className="px-3 py-3 text-right font-medium">Input</th>
              <th className="px-3 py-3 text-right font-medium">Cached input</th>
              <th className="px-3 py-3 text-right font-medium">Output</th>
            </tr>
          </thead>
          <tbody>
            {[...MODELS].sort((a, b) => a.orgName.localeCompare(b.orgName)).map((m) => (
              <tr key={m.slug} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">
                  <Link to={`/models/${m.slug}`} className="flex items-center gap-2 hover:text-fg">
                    <OrgAvatar org={m.org} name={m.orgName} size={20} /> {m.name} {m.free && <Badge color="green">Free tier</Badge>}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-fg3">{fmtCtx(m.context)}</td>
                <td className="px-3 py-2.5 text-right">{fmtPrice(m.price.input)}</td>
                <td className="px-3 py-2.5 text-right text-fg3">{fmtPrice(m.price.cachedInput ?? 0)}</td>
                <td className="px-3 py-2.5 text-right">{fmtPrice(m.price.output)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="mb-3 mt-12 text-lg font-semibold">Custom model GPU pricing</h2>
      <Card className="overflow-x-auto">
        <table className="tabular w-full text-[14px]">
          <thead className="text-left text-xs text-fg3">
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-medium">GPU</th>
              <th className="px-3 py-3 font-medium">VRAM</th>
              <th className="px-3 py-3 text-right font-medium">Per hour</th>
              <th className="px-3 py-3 text-right font-medium">Per second</th>
            </tr>
          </thead>
          <tbody>
            {GPUS.map((g) => (
              <tr key={g.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 font-medium">{g.name}</td>
                <td className="px-3 py-2.5 text-fg3">{g.vram} GB</td>
                <td className="px-3 py-2.5 text-right">${g.price.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-right text-fg3">${(g.price / 3600).toFixed(5)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-line px-4 py-3 text-xs text-fg3">Private endpoints are billed per second, only while replicas are running. Public marketplace models pay no GPU costs and instead earn 80% of caller token revenue.</div>
      </Card>
    </div>
  )
}
