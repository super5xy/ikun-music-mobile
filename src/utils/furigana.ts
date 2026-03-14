export type FuriganaToken = {
  surface: string
  reading?: string | null
}

export type FuriganaChunk = {
  surface: string
  reading?: string | null
  isKanaOnly: boolean
}

const rxKana = /[\u3040-\u309F\u30A0-\u30FF]/
const rxKanji = /[\u4E00-\u9FFF]/

const kataToHira = (input: string) =>
  input.replace(/[\u30A1-\u30F6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  )

export const normalizeReading = (reading?: string | null) => {
  if (!reading) return ''
  return kataToHira(reading)
}

export const buildFuriganaChunks = (tokens: FuriganaToken[]): FuriganaChunk[] => {
  const chunks: FuriganaChunk[] = []
  for (const token of tokens) {
    const reading = normalizeReading(token.reading)
    const isKanaOnly = !!token.surface && !rxKanji.test(token.surface)
    chunks.push({
      surface: token.surface,
      reading: reading || undefined,
      isKanaOnly,
    })
  }
  return chunks
}

export const hasFuriganaReading = (chunks: FuriganaChunk[]) => {
  return chunks.some((chunk) => !!chunk.reading && !chunk.isKanaOnly && rxKana.test(chunk.reading))
}
