import { View } from 'react-native'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import CheckBox from '@/components/common/CheckBox'
import styles from './style'

export default () => {
  const t = useI18n()
  const isShowLyricFurigana = useSettingValue('playDetail.isShowLyricFurigana')
  const setShowLyricFurigana = (show: boolean) => {
    updateSetting({ 'playDetail.isShowLyricFurigana': show })
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <CheckBox
          marginBottom={3}
          check={isShowLyricFurigana}
          label={t('play_detail_setting_show_furigana')}
          onChange={setShowLyricFurigana}
        />
      </View>
    </View>
  )
}
