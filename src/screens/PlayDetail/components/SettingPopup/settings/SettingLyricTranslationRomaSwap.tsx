import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import CheckBox from '@/components/common/CheckBox'
import styles from './style'
import { toggleSwapTranslationRoma } from '@/core/lyric'

export default () => {
  const t = useI18n()
  const isSwapLyricTranslationRoma = useSettingValue('playDetail.isSwapLyricTranslationRoma')
  const setSwapLyricTranslationRoma = (swap: boolean) => {
    updateSetting({ 'playDetail.isSwapLyricTranslationRoma': swap })
    void toggleSwapTranslationRoma(swap)
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <CheckBox
          marginBottom={3}
          check={isSwapLyricTranslationRoma}
          label={t('play_detail_setting_swap_lyric_translation_roma')}
          onChange={setSwapLyricTranslationRoma}
        />
      </View>
    </View>
  )
}
