export function SwiperPluginCarousel({ swiper, on: onEvent, extendParams: extendParams }) {
  onEvent("beforeInit", () => {
    swiper.classNames.push(`${swiper.params.containerModifierClass}carousel`)
    const params = { watchSlidesProgress: true, centeredSlides: true }
    Object.assign(swiper.params, params)
    Object.assign(swiper.originalParams, params)
  })

  onEvent("progress", () => {
    console.log({ swiper })
    const {
      activeIndex,
      previousIndex,
      swipeDirection,
      touchesDirection,
      slidesGrid,
      snapGrid,
      slides
    } = swiper

    const scaleStep = 0.07 //0.2
    const opacityStep = 0 //0.33

    const sideSlides = 2
    const factor = { 1: 2, 2: 1, 3: 0.2 }[sideSlides]
    const percentage = { 1: 50, 2: 50, 3: 67 }[sideSlides]

    const slidesLength = slides.length

    console.log(slides.map((slide) => slide.progress))

    slides.forEach((slide) => {
      const progress = slide.progress
      const absProgress = Math.abs(progress)
      const scale = absProgress > 1 ? 0.3 * (absProgress - 1) * factor + 1 : 1

      const opacityElements = slide.querySelectorAll(
        ".swiper-carousel-animate-opacity"
      )
      const translateX =
        progress * scale * percentage * (swiper.rtlTranslate ? -1 : 1) + "%"
      const scaleValue = 1 - absProgress * scaleStep
      const zIndex = slidesLength - Math.round(absProgress)
      slide.style.transform = `scale(${scaleValue})`
      slide.style.zIndex = zIndex
      slide.style.opacity =
        absProgress > sideSlides + 1 ? 0 : 1 - absProgress * opacityStep
      opacityElements.forEach((element) => {
        element.style.opacity = 1 - absProgress * opacityStep
      })
    })
  })

  onEvent("setTransition", (duration, speed) => {
    for (let i = 0; i < swiper.slides.length; i += 1) {
      const slide = swiper.slides[i]
      const opacityElements = slide.querySelectorAll(
        ".swiper-carousel-animate-opacity"
      )
      slide.style.transitionDuration = `${speed}ms`
      opacityElements.forEach((element) => {
        element.style.transitionDuration = `${speed}ms`
      })
    }
  })
}
