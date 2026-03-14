import { memo, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import Text, { AnimatedColorText } from '@/components/common/Text'
import { tokenizeFurigana } from '@/plugins/furigana'
import { type FuriganaChunk, hasFuriganaReading } from '@/utils/furigana'
import { createStyle } from '@/utils/tools'

const styles = createStyle({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  chunk: {
    alignItems: 'center',
    flexDirection: 'column',
  },
  readingText: {
    paddingBottom: 2,
  },
  surfaceText: {},
})

const textAlignToJustify: Record<'left' | 'center' | 'right', 'flex-start' | 'center' | 'flex-end'> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
}

type FuriganaTextProps = {
  text: string
  size: number
  lineHeight?: number
  textAlign: 'left' | 'center' | 'right'
  color: string
  opacity: number
  readingScale?: number
  readingLineHeightScale?: number
  enabled?: boolean
}

const FuriganaText = ({
  text,
  size,
  lineHeight,
  textAlign,
  color,
  opacity,
  readingScale = 0.55,
  readingLineHeightScale = 0.8,
  enabled = true,
}: FuriganaTextProps) => {
  const [chunks, setChunks] = useState<FuriganaChunk[] | null>(null)
  const hasJapanese = useMemo(() => /[\u3040-\u30FF\u4E00-\u9FFF]/.test(text), [text])

  useEffect(() => {
    let active = true
    if (!enabled || !text.trim() || !hasJapanese) {
      setChunks(null)
      return
    }
    void tokenizeFurigana(text)
      .then((result) => {
        if (!active) return
        setChunks(result)
      })
      .catch(() => {
        if (!active) return
        setChunks(null)
      })
    return () => {
      active = false
    }
  }, [enabled, hasJapanese, text])

  const showReading = enabled && !!chunks && hasFuriganaReading(chunks)

  if (!showReading) {
    return (
      <AnimatedColorText
        style={[styles.surfaceText, { textAlign }]}
        color={color}
        opacity={opacity}
        size={size}
      >
        {text}
      </AnimatedColorText>
    )
  }

  const justifyContent = textAlignToJustify[textAlign]

  return (
    <View style={[styles.container, { justifyContent }]}>
      {chunks!.map((chunk, index) => {
        const showChunkReading = !chunk.isKanaOnly && !!chunk.reading
        return (
          <View style={styles.chunk} key={`${index}-${chunk.surface}`}>
            {showChunkReading ? (
              <AnimatedColorText
                style={[
                  styles.readingText,
                  { textAlign, lineHeight: lineHeight ? lineHeight * readingLineHeightScale : undefined },
                ]}
                color={color}
                opacity={opacity}
                size={size * readingScale}
              >
                {chunk.reading}
              </AnimatedColorText>
            ) : null}
            <AnimatedColorText
              style={[styles.surfaceText, { textAlign, lineHeight }]}
              color={color}
              opacity={opacity}
              size={size}
            >
              {chunk.surface}
            </AnimatedColorText>
          </View>
        )
      })}
    </View>
  )
}

export default memo(FuriganaText)
