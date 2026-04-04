import {
  hideDesktopLyricView,
  showDesktopLyricView,
  setSendLyricTextEvent,
  setLyric,
  play,
  pause,
  setPlaybackRate,
  toggleTranslation,
  toggleRoma,
  toggleFurigana,
  setScrollDelay,
  toggleLock,
  setColor,
  setAlpha,
  setTextSize,
  setShowToggleAnima,
  setSingleLine,
  setPosition,
  setMaxLineNum,
  setWidth,
  setLyricTextPosition,
  checkOverlayPermission,
  openOverlayPermissionActivity,
  onPositionChange,
} from '@/utils/nativeModules/lyricDesktop'
import settingState from '@/store/setting/state'
import playerState from '@/store/player/state'
import { tranditionalize } from '@/utils/simplify-chinese-main'
import { getPosition } from '@/plugins/player'
import { buildFuriganaLyric } from '@/plugins/furigana'
export { onLyricLinePlay } from '@/utils/nativeModules/lyricDesktop'

const getDesktopLyricPayload = async (isShowFuriganaOverride?: boolean) => {
  const setting = settingState.setting
  let lrc = playerState.musicInfo.lrc ?? ''
  let tlrc = playerState.musicInfo.tlrc ?? ''
  let rlrc = playerState.musicInfo.rlrc ?? ''
  if (setting['player.isS2t']) {
    lrc = tranditionalize(lrc)
    tlrc = tranditionalize(tlrc)
  }
  const isShowFurigana = isShowFuriganaOverride ?? setting['desktopLyric.isShowLyricFurigana']
  const furigana = isShowFurigana ? await buildFuriganaLyric(lrc) : ''
  return { lrc, tlrc, rlrc, furigana }
}

export const showDesktopLyric = async () => {
  const setting = settingState.setting
  const { lrc, tlrc, rlrc, furigana } = await getDesktopLyricPayload()

  await showDesktopLyricView({
    isShowToggleAnima: setting['desktopLyric.showToggleAnima'],
    isSingleLine: setting['desktopLyric.isSingleLine'],
    isShowTranslation: setting['player.isShowLyricTranslation'],
    isShowRoma: setting['player.isShowLyricRoma'],
    isShowFurigana: setting['desktopLyric.isShowLyricFurigana'],
    scrollDelay: setting['desktopLyric.scrollDelay'],
    isLock: setting['desktopLyric.isLock'],
    unplayColor: setting['desktopLyric.style.lyricUnplayColor'],
    playedColor: setting['desktopLyric.style.lyricPlayedColor'],
    shadowColor: setting['desktopLyric.style.lyricShadowColor'],
    opacity: setting['desktopLyric.style.opacity'],
    textSize: setting['desktopLyric.style.fontSize'],
    width: setting['desktopLyric.width'],
    maxLineNum: setting['desktopLyric.maxLineNum'],
    positionX: setting['desktopLyric.position.x'],
    positionY: setting['desktopLyric.position.y'],
    textPositionX: setting['desktopLyric.textPosition.x'],
    textPositionY: setting['desktopLyric.textPosition.y'],
  })
  await setLyric(lrc, tlrc, rlrc, furigana)
  if (playerState.isPlay && !global.lx.gettingUrlId) {
    void getPosition().then((position) => {
      void play(position * 1000)
    })
  }
}

export const hideDesktopLyric = async () => {
  return hideDesktopLyricView()
}

export const playDesktopLyric = play
export const pauseDesktopLyric = pause
export const setDesktopLyric = async (lyric: string, translation: string, romalrc: string) => {
  const setting = settingState.setting
  const furigana = setting['desktopLyric.isShowLyricFurigana']
    ? await buildFuriganaLyric(lyric)
    : ''
  return setLyric(lyric, translation, romalrc, furigana)
}
export const setDesktopLyricPlaybackRate = setPlaybackRate
export const toggleDesktopLyricTranslation = toggleTranslation
export const toggleDesktopLyricRoma = toggleRoma
export const setDesktopLyricFuriganaEnabled = toggleFurigana
export const toggleDesktopLyricFurigana = async (isShowFurigana: boolean) => {
  await toggleFurigana(isShowFurigana)
  const { lrc, tlrc, rlrc, furigana } = await getDesktopLyricPayload(isShowFurigana)
  await setLyric(lrc, tlrc, rlrc, isShowFurigana ? furigana : '')
  if (!global.lx.gettingUrlId) {
    const position = await getPosition()
    await play(position * 1000)
  }
}
export const setDesktopLyricScrollDelay = setScrollDelay
export const toggleDesktopLyricLock = toggleLock
export const setDesktopLyricColor = async (
  unplayColor: string | null,
  playedColor: string | null,
  shadowColor: string | null
) => {
  return setColor(
    unplayColor ?? settingState.setting['desktopLyric.style.lyricUnplayColor'],
    playedColor ?? settingState.setting['desktopLyric.style.lyricPlayedColor'],
    shadowColor ?? settingState.setting['desktopLyric.style.lyricShadowColor']
  )
}
export const setDesktopLyricAlpha = setAlpha
export const setDesktopLyricTextSize = setTextSize
export const setShowDesktopLyricToggleAnima = setShowToggleAnima
export const setDesktopLyricSingleLine = setSingleLine
export const setDesktopLyricPosition = setPosition
export const setDesktopLyricMaxLineNum = setMaxLineNum
export const setDesktopLyricWidth = setWidth
export const setDesktopLyricTextPosition = async (
  x: LX.AppSetting['desktopLyric.textPosition.x'] | null,
  y: LX.AppSetting['desktopLyric.textPosition.y'] | null
) => {
  return setLyricTextPosition(
    x ?? settingState.setting['desktopLyric.textPosition.x'],
    y ?? settingState.setting['desktopLyric.textPosition.y']
  )
}
export const checkDesktopLyricOverlayPermission = checkOverlayPermission
export const openDesktopLyricOverlayPermissionActivity = openOverlayPermissionActivity
export const onDesktopLyricPositionChange = onPositionChange

export const showRemoteLyric = async (isSend: boolean) => {
  await setSendLyricTextEvent(isSend)
  if (isSend) {
    const { lrc, tlrc, rlrc, furigana } = await getDesktopLyricPayload()
    await setLyric(lrc, tlrc, rlrc, furigana)
    if (playerState.isPlay && !global.lx.gettingUrlId) {
      void getPosition().then((position) => {
        void play(position * 1000)
      })
    }
  }
}
