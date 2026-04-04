import { memo } from 'react'
import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import CheckBoxItem from '../../components/CheckBoxItem'
import { updateSetting } from '@/core/common'
import { toggleDesktopLyricFurigana } from '@/core/desktopLyric'

export default memo(() => {
  const t = useI18n()
  const isShowLyricFurigana = useSettingValue('desktopLyric.isShowLyricFurigana')

  const handleChange = (show: boolean) => {
    void toggleDesktopLyricFurigana(show).then(() => {
      updateSetting({ 'desktopLyric.isShowLyricFurigana': show })
    })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem
        check={isShowLyricFurigana}
        onChange={handleChange}
        label={t('setting_lyric_desktop_show_furigana')}
      />
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
})
