import type { Metadata } from 'next'
import JungleMultiplication from './JungleMultiplication'

export const metadata: Metadata = {
  title: 'Djungelmatte – multiplikation',
  description: 'Öva multiplikationstabellerna tillsammans med Mowgli, Baloo och Bagheera.',
}

export default function DjungelPage() {
  return <JungleMultiplication />
}
