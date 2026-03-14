import { MeCab } from 'react-native-mecab'
import { buildFuriganaChunks, type FuriganaChunk, type FuriganaToken } from '@/utils/furigana'

let mecabInstance: MeCab | null = null
let initPromise: Promise<void> | null = null
const DEFAULT_DIC = 'ipadic'
const furiganaCache = new Map<string, FuriganaChunk[]>()
const MAX_CACHE = 200

const ensureInit = async () => {
  if (mecabInstance) return
  if (!initPromise) {
    mecabInstance = new MeCab()
    initPromise = mecabInstance.init(DEFAULT_DIC)
  }
  await initPromise
}

const parseTokenLine = (line: string): FuriganaToken | null => {
  const [surfacePart, featurePart] = line.split(':')
  if (!surfacePart || !featurePart) return null
  const features = featurePart.split(',')
  const reading = features[7] ?? null
  return {
    surface: surfacePart,
    reading: reading && reading !== '*' ? reading : null,
  }
}

export const tokenizeFurigana = async (text: string): Promise<FuriganaChunk[]> => {
  if (!text) return []
  const cached = furiganaCache.get(text)
  if (cached) return cached
  await ensureInit()
  const result = await mecabInstance!.tokenize(text)
  if (!result) return []
  const lines = result.split('\n').filter(Boolean)
  const tokens: FuriganaToken[] = []
  for (const line of lines) {
    if (line === 'EOS') continue
    const token = parseTokenLine(line)
    if (token) tokens.push(token)
  }
  const chunks = buildFuriganaChunks(tokens)
  furiganaCache.set(text, chunks)
  if (furiganaCache.size > MAX_CACHE) {
    const firstKey = furiganaCache.keys().next().value as string | undefined
    if (firstKey) furiganaCache.delete(firstKey)
  }
  return chunks
}

export const disposeFurigana = async () => {
  if (!mecabInstance) return
  const instance = mecabInstance
  mecabInstance = null
  initPromise = null
  await instance.dispose()
}
