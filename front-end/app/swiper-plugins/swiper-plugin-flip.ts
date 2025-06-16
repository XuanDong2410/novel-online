import type { Swiper, SwiperEvents, SwiperModule, SwiperOptions } from "swiper/types"
import "./swiper-plugin-flip.scss"
import {
  getSlideTransformEl,
  effectVirtualTransitionEnd,
  effectTarget
} from "swiper/effect-utils"

export function SwiperPluginFlip({
  swiper,
  on: onEvent
}: {
  swiper: Swiper
  on: <Name extends keyof SwiperEvents>(
    name: Name,
    fn: SwiperEvents[Name]
  ) => void
}) {
  onEvent("beforeInit", () => {
    if (!swiper.params.effect?.startsWith("flip-")) return
    ;(swiper as unknown as any).classNames.push(
      `${swiper.params.containerModifierClass}-flip`
    )
    const params = {
      watchSlidesProgress: true,
      centeredSlides: true,
      virtualTranslate: !swiper.params.cssMode
    }
    Object.assign(swiper.params, params)
    Object.assign(swiper.originalParams, params)
  })

  onEvent("setTransition", (_, duration) => {
    if (!swiper.params.effect?.startsWith("flip-")) return

    const transformElements = swiper.slides.map((slideEl) =>
      getSlideTransformEl(slideEl)
    )
    transformElements.forEach((el) => {
      el.style.transitionDuration = `${duration}ms`
    })

    effectVirtualTransitionEnd({
      swiper,
      duration,
      transformElements,
      allSlides: true
    })
  })

  onEvent("setTranslate", () => {
    if (!swiper.params.effect?.startsWith("flip-")) return

    const is3D = swiper.params.effect === "flip-3d"

    const { slides } = swiper

    const params = swiper.params.fadeEffect

    for (let i = 0; i < slides.length; i += 1) {
      const slideEl = swiper.slides[i] as HTMLElement & {
        progress: number
        swiperSlideOffset: number
        swiperSlideSize: number
      }
      const { progress, swiperSlideOffset: offset } = slideEl

      let tx = -offset
      if (!swiper.params.virtualTranslate) tx -= swiper.translate

      let ty = 0
      if (!swiper.isHorizontal()) {
        ty = tx
        tx = 0
      }

      const targetEl = effectTarget(params, slideEl)

      // const slideOpacity = Math.max(1 - Math.abs(slideEl.progress), 0)
      let scale = 1
      let rotateY = 0
      let skewY = 0
      if (slideEl.progress > 0) {
        if (!swiper.isHorizontal())
          ty -= slideEl.swiperSlideSize * slideEl.progress
        else tx -= slideEl.swiperSlideSize * slideEl.progress

        if (is3D) {
          // scale = 0.1 * progress + 1
          rotateY = Math.round(60 * progress) // 45deg
        }
        // skewY =(-progress)
        // targetEl.style.opacity = slideOpacity;
      }

      targetEl.style.transform = `translate3d(${tx}px, ${ty}px, 0px) scale(${scale}) rotateY(${rotateY}deg) skewY(${skewY}deg)`
      targetEl.style.zIndex = slides.length - i
    }
  })
}
