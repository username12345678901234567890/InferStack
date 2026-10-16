import { useMemo } from 'react'
import { MODELS } from '../data/models'
import type { CatalogModel, CustomModel } from '../data/types'
import { useStore } from '../store'

export function customToCatalog(m: CustomModel, username: string): CatalogModel {
  return {
    slug: `${username}/${m.slug}`,
    name: m.displayName,
    org: username,
    orgName: username,
    hfId: m.sourceRepo ?? '',
    architecture: m.architecture,
    params: m.params ?? 0,
    context: m.contextLength,
    license: 'custom',
    released: new Date(m.createdAt).toISOString().slice(0, 10),
    input: ['text'],
    output: ['text'],
    capabilities: [],
    price: m.price,
    description: m.description || `${m.format.toUpperCase()} · ${m.architecture} · ${m.gpuCount}x ${m.gpu}`,
    hfLikes: 0,
    hfDownloads: 0,
    custom: true,
    owner: username,
  }
}

/** 카탈로그 + (배포 완료된) 내 커스텀 모델 */
export function useAllModels(opts: { includePrivate?: boolean } = {}) {
  const custom = useStore((s) => s.customModels)
  const username = useStore((s) => s.user?.username ?? 'me')
  return useMemo(() => {
    const mine = custom.filter((m) => m.status === 'live' && (opts.includePrivate || m.visibility === 'public')).map((m) => customToCatalog(m, username))
    return [...mine, ...MODELS]
  }, [custom, username, opts.includePrivate])
}
