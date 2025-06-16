<!-- <route lang="yaml">
meta:
  hiddenHeader: true
</route> -->

<template>
  <q-page
    class="fixed top-0 left-0 size-100%"
    :style="{
      backgroundColor: theme.bg,
      color: theme.color
    }"
  >
    <div
      v-if="bookLoading || volumeLoading"
      class="absolute top-1/2 left-1/2 translate--1/2"
    >
      <q-spinner color="blue" />
    </div>

    <div
      v-else-if="!bookData && !volumeData && bookError && volumeError"
      class="absolute top-1/2 left-1/2 translate--1/2"
    >
      {{ bookError ?? volumeError ?? "unknown_error" }}
      {{ !!bookData }} {{ !!volumeData }}
    </div>

    <swiper
      v-else
      :slides-per-view="1"
      :centered-slides="true"
      :space-between="10"
      :modules="modules"
      virtual
      :effect="effect.mode"
      class="absolute top-0 left-0 size-100% user-select-none"
      :style="{ fontFamily, fontSize: `${fontSize}px`, lineHeight }"
      @real-index-change="currentPage = $event.realIndex"
      @init="swiperRef = $event"
    >
      <swiper-slide :virtual-index="0">
        <div
          ref="welcomeRef"
          class="h-100vh px-2 py-4"
          :style="{
            backgroundColor: theme.bg
          }"
        >
          <div
            class="absolute top-1/2 left-1/2 translate--1/2 text-center w-full"
          >
            <div class="text-h6 text-18px">Chương 1</div>
            <div class="text-gray-200 w-full line-clamp-3 px-4">
              Thế là Hiratsuka Shizuka đã mở ra một cuộc chiến mới
            </div>
          </div>
        </div>
      </swiper-slide>
      <swiper-slide
        v-for="(_, index) in pages"
        :key="index"
        :virtual-index="index"
      >
        <div
          class="h-100vh px-2 py-4"
          :style="{
            backgroundColor: theme.bg
          }"
          v-html="_.innerHTML"
        />
      </swiper-slide>
    </swiper>
  </q-page>

  <q-footer
    :style="{
      backgroundColor: theme.bg,
      color: theme.color
    }"
    class="z-101"
  >
    <q-tabs
      indicator-color="transparent"
      active-color="white"
      class="bg-dark-page text-grey-5 !shadow-2 text-[12px] tabs-main"
      no-caps
    >
      <q-route-tab
        v-for="(btn, index) in buttons"
        :key="index"
        replace
        :ripple="false"
        class="pt-1"
        :class="{
          'q-router-link--exact-active': btn.check.value
        }"
        @click="btn.onClick"
      >
        <div
          class="bg-icon"
          :class="{
            'bg-transparent': !btn.check.value
          }"
        >
          <component
            :is="btn.check.value ? btn.icon[1] : btn.icon[0]"
            class="my-1 size-1.8em"
          />
        </div>
      </q-route-tab>
    </q-tabs>
  </q-footer>

  <!-- more -->
  <More
    v-if="theme && bookData"
    :theme="theme"
    :max-page="pages.length"
    :can-prev="canPrev"
    :can-next="canNext"
    v-model:current-page="currentPage"
    :books="bookData.books"
    :current-book="currentBook"
    v-model:chap="currentChap"
    @click:prev="prevVolume"
    @click:next="nextVolume"
    ref="moreRef"
  />
  <!-- /more -->

  <!-- bottom settings -->
  <Settings
    v-if="theme"
    :effects="effects"
    :themes="themes"
    :fonts="fonts"
    v-model:theme="theme"
    v-model:effect="effect"
    v-model:font-size="fontSize"
    v-model:font-family="fontFamily"
    v-model:line-height="lineHeight"
    ref="settingsRef"
  />
  <!-- /bottom settings -->

  <!-- comment -->
  <Comments :theme="theme" ref="commentsRef" />
  <!-- /comment -->
</template>

<script lang="ts" setup>
import type { Swiper as SwiperType } from "swiper"
import { Swiper, SwiperSlide } from "swiper/vue"
import { useRequest } from "vue-request"
import { darkenColor } from "./logic/darken-color"
import { lightenColor } from "./logic/lighten-color"
import { paginateHtml } from "./logic/reader/paginate"
import { styleChanges } from "./logic/reader/style-changes"
import Comments from "./toolbars/comments.vue"
import More from "./toolbars/more.vue"
import Settings from "./toolbars/settings.vue"

import "@webzlodimir/vue-bottom-sheet/dist/style.css"
import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/virtual"

import IconamoonCommentDots from '~icons/iconamoon/comment-dots'
import IconamoonCommentDotsFill from "~icons/iconamoon/comment-dots-fill"
import PhCommand from "~icons/ph/command"
import PhCommandBold from "~icons/ph/command-bold"
import PhDotsThreeOutlineFill from "~icons/ph/dots-three-outline-fill"
import PhDotsThreeOutlineLight from "~icons/ph/dots-three-outline-light"
import StreamlineAiGenerateVariationSpark from "~icons/streamline/ai-generate-variation-spark"
import StreamlineAiGenerateVariationSparkSolid from "~icons/streamline/ai-generate-variation-spark-solid"
import StreamlineAiSettingsSpark from '~icons/streamline/ai-settings-spark'
import StreamlineAiSettingsSparkSolid from "~icons/streamline/ai-settings-spark-solid"
import StreamlineLike1 from "~icons/streamline/like-1"
import StreamlineLike1Solid from "~icons/streamline/like-1-solid"

// eslint-disable-next-line import/order
import type { API } from "~/pages/novel/[shokugan]/[episode].vue"

export interface Effect {
  name: string
  mode: `flip-${"2d" | "3d"}` | `fade-${"normal" | "reverse"}`
}

export interface ThemeBase {
  bg: string
  color: string
}
export interface Theme extends ThemeBase {
  darken: string
  lighten: string
}

export interface Font {
  name: string
  value: string
}

export interface Volume {
  id: string
  name: string
  order: string
  updatedAt?: number
  to: string
}
export interface Book {
  id: string
  image: string
  name: string
  vols: Volume[]
}

const props = defineProps<{
  api: API

  modules: unknown[]

  effects: Effect[]
  colors: ThemeBase[]
  fonts: Font[]

  bookId: string

  canPrev: boolean
  canNext: boolean
}>()
// mode flip-2d, flip-3d, fade-normal, fade-reverse

const pages = shallowReactive<HTMLDivElement[]>([])

const welcomeRef = ref<HTMLDivElement>()

// =========== effect ==========
const $effect = defineModel<Effect["mode"]>("effect", { required: true })
const effect = computed<Effect>({
  get() {
    return props.effects.find((item) => item.mode === $effect.value)!
  },
  set(val) {
    $effect.value = val.mode
  }
})
// =========== /effect ==========

// =========== theme ==========
const themes = computed<Theme[]>(() =>
  props.colors.map(({ bg, color }) => {
    return {
      bg,
      color,
      darken: darkenColor(bg, 10),
      lighten: lightenColor(bg, 10)
    }
  })
)
const $theme = defineModel<Theme["bg"]>("theme", { required: true })
const theme = computed<Theme>({
  get: () => themes.value.find(({ bg }) => bg === $theme.value)!,
  set: (val) => ($theme.value = val.bg)
})
// =========== /theme ==========

// =========== font ===========
const $fontFamily = defineModel<Font["value"]>("fontFamily", { required: true })
const fontFamily = computed<Font>({
  get: () => props.fonts.find((item) => item.value === $fontFamily.value)!,
  set: (val) => ($fontFamily.value = val.value)
})
// =========== /font ===========

// =========== chap ===========
const $currentChap = defineModel<Volume["id"]>("currentChap", {
  required: true
})
const currentBook = computed<Book>(() => {
  if (bookData.value)
    for (const [, book] of bookData.value.books)
      if (book.vols.find((vol) => vol.id === $currentChap.value)) return book

  // eslint-disable-next-line functional/no-throw-statements
  throw (bookError.value = new Error("Can't resolve current book"))
})
const currentChap = computed<Volume>({
  get: () => {
    const vol = currentBook.value?.vols.find(
      (vol) => vol.id === $currentChap.value
    )
    if (vol) return vol

    // eslint-disable-next-line functional/no-throw-statements
    throw (volumeError.value = new Error("Can't resolve current chap"))
  },
  set: (val) => ($currentChap.value = val.id)
})
function prevVolume() {}
function nextVolume() {}
// =========== /chap ===========

const fontSize = defineModel<number>("fontSize", { required: true })
const lineHeight = defineModel<number>("lineHeight", { required: true })

const {
  data: bookData,
  loading: bookLoading,
  error: bookError,
  runAsync: bookRunAsync
} = useRequest(
  () => {
    return props.api.fetchShokugan(props.bookId)
  },
  { manual: true }
)

const {
  data: volumeData,
  loading: volumeLoading,
  error: volumeError
} = useRequest(
  async () => {
    if (!bookData.value) await bookRunAsync()

    return props.api.fetchVolume(currentBook.value, currentChap.value)
  },
  {
    refreshDeps() {
      return $currentChap.value
    }
  }
)

const modeRendered = new Set<string>()
watch(
  [fontFamily, fontSize, lineHeight, welcomeRef, bookData, volumeData],
  async ([font, size, lineHeight, welcomeRef, bookData, data]) => {
    if (!welcomeRef) return

    if (!bookData || !data) return

    const id = `${font}@${size}@${lineHeight}`
    if (modeRendered.has(id)) return
    modeRendered.add(id)

    const newPages = await paginateHtml(
      styleChanges(welcomeRef),
      parseFloat(getComputedStyle(welcomeRef).height),
      data.content
    )

    pages.splice(newPages.length)
    // eslint-disable-next-line no-void
    newPages.forEach((html, index) => void (pages[index] = html))
  },
  { immediate: true }
)

const currentPage = defineModel<number>("currentPage", { required: true })
const swiperRef = ref<SwiperType>()
watch([currentPage, swiperRef], ([currentPage, swiperRef]) => {
  if (swiperRef) swiperRef.slideTo(currentPage)
})

const settingsRef = ref<InstanceType<typeof Settings>>()
const moreRef = ref<InstanceType<typeof More>>()
const commentsRef = ref<InstanceType<typeof Comments>>()

const sheets = [settingsRef, moreRef, commentsRef]
function closeAllSheet(activator: (typeof sheets)[0]) {
  for (const sheet of sheets) {
    if (sheet !== activator) sheet.value?.sheet?.close()
  }
}

const buttons = [
  {
    icon: [
      StreamlineAiGenerateVariationSpark,
      StreamlineAiGenerateVariationSparkSolid
    ],
    check: computed(() => {
      return moreRef.value?.sheet?.showSheet
    }),
    onClick() {
      void closeAllSheet(moreRef)
      if (moreRef.value?.sheet?.showSheet) moreRef.value?.sheet.close()
      else moreRef.value?.sheet?.open()
    }
  },
  // {
  //   icon: [StreamlineLike1, StreamlineLike1Solid],
  //   check: computed(() => {
  //     return false
  //   }),
  //   onClick() {}
  // },
  {
    icon: [StreamlineAiSettingsSpark, StreamlineAiSettingsSparkSolid],
    check: computed(() => {
      return settingsRef.value?.sheet?.showSheet
    }),
    onClick() {
      void closeAllSheet(settingsRef)
      if (settingsRef.value?.sheet?.showSheet) settingsRef.value?.sheet?.close()
      else settingsRef.value?.sheet?.open()
    }
  },
  {
    icon: [IconamoonCommentDots, IconamoonCommentDotsFill],
    check: computed(() => {
      return commentsRef.value?.sheet?.showSheet
    }),
    onClick() {
      void closeAllSheet(commentsRef)
      if (commentsRef.value?.sheet?.showSheet) commentsRef.value?.sheet?.close()
      else commentsRef.value?.sheet?.open()
    }
  },
  {
    icon: [PhCommand, PhCommandBold],
    check: computed(() => {
      return false
    }),
    onClick() {}
  }
]
</script>

<style lang="scss" scoped>
.tabs-main :deep(.q-router-link--exact-active) {
  svg {
    color: var(--sakura);
  }
}
.tabs-main :deep(.q-tab) {
  width: (100% / 5) !important;
  min-width: 0 !important;

  .q-focus-helper {
    display: none;
  }

  .bg-icon {
    @apply px-4 py-2 rounded-20px bg-pink-300 bg-opacity-10 transition transition-bg duration-222;
  }

  &:hover {
    .bg-icon {
      @apply bg-pink-300 bg-opacity-5;
    }
  }
}
</style>
