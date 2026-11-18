import { tinubuMonument } from './tinubu'
import { hamzatMonument } from './hamzat'
import { oyebanjiMonument } from './oyebanji'
import { ekitiLogoMonument } from './ekiti-logo'
import type { Monument } from './monuments'

export * from './monuments'

const monumentMap: Record<string, Monument> = {
  tinubu: tinubuMonument,
  hamzat: hamzatMonument,
  oyebanji: oyebanjiMonument,
  'ekiti-logo': ekitiLogoMonument,
}

export const allMonuments: Monument[] = Object.values(monumentMap)

export function getMonument(slug: string): Monument | undefined {
  return monumentMap[slug]
}

export function getStoryByHotspot(monument: Monument, hotspotId: string) {
  return monument.stories.find((s) => s.hotspotId === hotspotId)
}
