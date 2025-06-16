<route lang="yaml">
meta:
  hiddenHeader: true
</route>

<template>
  <q-page class="fixed top-0 left-0 size-100%">
    <swiper
      :slides-per-view="1"
      centered-slides
      :space-between="10"
      :modules="[Virtual]"
      @reach-end="settingsStore.lazyPaginateBook ? onReachEnd() : undefined"
      class="absolute top-0 left-0 size-100% user-select-none"
    >
      <swiper-slide v-for="(_, index) in virtualPages" :key="index">
        <div
          :ref="($el) => (pagesRef[index] = $el as HTMLDivElement)"
          :index.prop="index"
          class="h-100vh px-2 py-4"
          v-html="_"
        />
      </swiper-slide>
    </swiper>
  </q-page>
</template>

<script lang="ts" setup>
import content from "src/logic/reader/__test__/assets/content.txt?raw"
import { Virtual } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/vue"

import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/virtual"

const settingsStore = useSettingsStore()

paginateHtml(content)
// const virtualWrap = createVirtualWrap(content)

const virtualPages = shallowReactive<string[]>([""])
const pagesRef = shallowReactive<HTMLDivElement[]>([])

function onReachEnd() {
  if (!nodeIsEmpty(virtualWrap)) virtualPages.push("")
}

// watch(
//   () => Object.values(pagesRef),
//   async (newPages, { length }) => {
//     while (length < newPages.length) {
//       console.time("pagninate")

//       const index = length++
//       await paginateHtml(newPages[index], virtualWrap)
//       virtualPages[index] = newPages[index].innerHTML

//       console.timeEnd("pagninate")
//     }

//     if (!settingsStore.lazyPaginateBook) onReachEnd()
//   }
// )

</script>
