import type { Swiper, SwiperEvents } from "swiper/types"
import "./swiper-plugin-fade.scss"
import {
  getSlideTransformEl,
  effectVirtualTransitionEnd,
  effectTarget
} from "swiper/effect-utils"

export function SwiperPluginFade({
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
    if (!swiper.params.effect?.startsWith("fade-")) return
    ;(swiper as unknown as any).classNames.push(
      `${swiper.params.containerModifierClass}-fade`
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
    if (!swiper.params.effect?.startsWith("fade-")) return

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
    if (!swiper.params.effect?.startsWith("fade-")) return
    const { slides } = swiper

    for (let i = 0; i < slides.length; i += 1) {
      const slideEl = swiper.slides[i] as HTMLElement & {
        progress: number
        swiperSlideOffset: number
        swiperSlideSize: number
      }
      const { swiperSlideOffset: offset } = slideEl

      let tx = -offset
      if (!swiper.params.virtualTranslate) tx -= swiper.translate

      let ty = 0
      if (!swiper.isHorizontal()) {
        ty = tx
        tx = 0
      }

      const targetEl = effectTarget(undefined, slideEl)
      const slideOpacity = Math.max(1 - Math.abs(slideEl.progress), 0)

      targetEl.style.filter = `blur(${(((swiper.params.effect === "fade-reverse" ? -1 : 1) * slideEl.progress) / 1) * 10}px)`

      targetEl.style.transform = `translate3d(${tx}px, ${ty}px, 0px)`
      targetEl.style.opacity = slideOpacity
      targetEl.style.zIndex = slides.length - i
    }
  })
}
