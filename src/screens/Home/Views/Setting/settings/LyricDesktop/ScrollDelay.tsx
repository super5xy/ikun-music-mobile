import { memo, useCallback, useState } from 'react'
import { View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import Slider, { type SliderProps } from '../../components/Slider'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { setDesktopLyricScrollDelay } from '@/core/desktopLyric'
import { updateSetting } from '@/core/common'

export default memo(() => {
  const t = useI18n()
  const scrollDelay = useSettingValue('desktopLyric.scrollDelay')
  const theme = useTheme()
  const [sliderValue, setSliderValue] = useState(scrollDelay)
  const [isSliding, setSliding] = useState(false)

  const handleSlidingStart = useCallback<NonNullable<SliderProps['onSlidingStart']>>(() => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback<NonNullable<SliderProps['onValueChange']>>((value) => {
    setSliderValue(value)
  }, [])
  const handleSlidingComplete = useCallback<NonNullable<SliderProps['onSlidingComplete']>>(
    (value) => {
      const fixedValue = Number(value.toFixed(1))
      if (scrollDelay == fixedValue) return
      void setDesktopLyricScrollDelay(fixedValue)
        .then(() => {
          updateSetting({ 'desktopLyric.scrollDelay': fixedValue })
        })
        .finally(() => {
          setSliding(false)
        })
    },
    [scrollDelay]
  )

  const displayValue = (isSliding ? sliderValue : scrollDelay).toFixed(1)

  return (
    <SubTitle title={t('setting_lyric_desktop_scroll_delay')}>
      <View style={styles.content}>
        <Text style={{ color: theme['c-primary-font'] }}>{displayValue}s</Text>
        <Slider
          minimumValue={-3}
          maximumValue={3}
          onSlidingComplete={handleSlidingComplete}
          onValueChange={handleValueChange}
          onSlidingStart={handleSlidingStart}
          step={0.1}
          value={scrollDelay}
        />
      </View>
    </SubTitle>
  )
})

const styles = createStyle({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
})
