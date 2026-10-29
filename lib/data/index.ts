import { tinubuMonument } from './tinubu'
import { sanwoOluMonument } from './sanwo-olu'
import type { Monument } from './monuments'

export * from './monuments'

const monumentMap: Record<string, Monument> = {
  tinubu: tinubuMonument,
  'sanwo-olu': sanwoOluMonument,
}

export const allMonuments: Monument[] = Object.values(monumentMap)

export function getMonument(slug: string): Monument | undefined {
  return monumentMap[slug]
}

export function getStoryByHotspot(monument: Monument, hotspotId: string) {
  return monument.stories.find((s) => s.hotspotId === hotspotId)
}
