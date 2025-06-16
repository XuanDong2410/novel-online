<!-- <route lang="yaml">
meta:
  hiddenHeader: true
</route> -->

<template>
  <ClientOnly>
  <ln-reader
    :api="api"
    book-id="12"
    :modules="[Virtual, SwiperPluginFlip, SwiperPluginFade]"
    :effects="effects"
    v-model:effect="$effect"
    :colors="colors"
    v-model:theme="$theme"
    :fonts="fonts"
    v-model:font-family="fontFamily"
    v-model:font-size="fontSize"
    v-model:line-height="lineHeight"
    v-model:current-page="currentPage"
    v-model:current-chap="currentChap"
    can-prev
    can-next
  />
</ClientOnly>
</template>

<script lang="ts" setup>
import type {
  Book,
  Effect,
  Font,
  ThemeBase,
  Volume
} from "~/components/ln-reader/index.vue"
import { SwiperPluginFade } from "~/swiper-plugins/swiper-plugin-fade"
import { SwiperPluginFlip } from "~/swiper-plugins/swiper-plugin-flip"
import { Virtual } from "swiper/modules"

import "@fontsource/roboto"
import "@fontsource/merriweather"
import "@fontsource/open-sans"
import "@fontsource/bitter"
import "@fontsource/lato"
import "@fontsource/libre-baskerville"
import "@fontsource/source-sans-pro" // "Sans Pro" is known as "Source Sans Pro" in fontsource
import "@fontsource/lora"
import "@fontsource/karla"
import "@fontsource/rubik"
import "@fontsource/cardo"
import "@fontsource/nunito"

import content from "./content.txt?raw"
definePageMeta({
  layout: "main",
  meta: {
    hiddenHeader: true
  }
})
defineProps<{
  shokugan: string
  episode: string
}>()

const effects: Effect[] = [
  {
    name: "Flip 2d",
    mode: "flip-2d"
  },
  {
    name: "Flip 3d",
    mode: "flip-3d"
  },
  {
    name: "Fade",
    mode: "fade-normal"
  },
  {
    name: "Fade reverse",
    mode: "fade-reverse"
  }
] as const
const $effect = ref<Effect["mode"]>("flip-3d")

const colors: ThemeBase[] = [
  { color: "#000", bg: "#f0f8ff" },
  { color: "#000", bg: "#f5f5dc" },
  { color: "#000", bg: "#d3d3d3" },
  { color: "#fff", bg: "#bc8f8f" },
  { color: "#000", bg: "#98fb98" },
  { color: "#000", bg: "#f7f8fa" },
  { color: "#000", bg: "#e4e0dd" },
  { color: "#fff", bg: "#6e707f" },
  { color: "#fff", bg: "#333333" }
] as const
const $theme = ref<ThemeBase["bg"]>("#333333")

const fonts: Font[] = [
  { name: "System", value: "system-ui" },
  { name: "Roboto", value: "Roboto" },
  { name: "Merriwather", value: "Merriwather" },
  { name: "Open Sans", value: "Open Sans" },
  { name: "Bitter", value: "Bitter" },
  { name: "Lato", value: "Lato" },
  { name: "Libre Baskerville", value: "Libre Baskerville" },
  { name: "Sans Pro", value: "Sans Pro" },
  { name: "Lora", value: "Lora" },
  { name: "Karla", value: "Karla" },
  { name: "Rubik", value: "Rubik" },
  { name: "Cardo", value: "Cardo" },
  { name: "Nunito", value: "Nunito" }
] as const
const fontFamily = ref<Font["value"]>("Roboto")

const currentChap = ref<Volume["id"]>("Minh họa")

const fontSize = ref(14)
const lineHeight = ref(1.5)

const currentPage = ref(0)
// eslint-disable-next-line functional/no-classes
class Api {
  async fetchShokugan(_shokugan: string) {
    const books = Array(10)
      .fill(0)
      .map(
        (_, i): Book => ({
          id: "tap-1-nhap-hoc-i" + i,
          name: `Tập ${i} - Nhập học (I)`,
          // image: "https://static.wikia.nocookie.net/sonako/images/8/83/MKnR_v01_cover.jpg/revision/latest/scale-to-width-down/150?cb=20120926052322",
          image: "https://static.cdnno.com/poster/ta-mo-that-su-la-co-nhi-vien-khong-phai-sat-thu-duong/300.jpg?1714982331",
          vols: [
            {
              name: "Minh họa",
              id: "Minh họa",
              to: "/vi/wiki/Mahouka_Koukou_no_Rettousei_-_Vol_1_Minh_h%E1%BB%8Da"
            },
            {
              name: "Trường Trung học Pháp thuật là---",
              id: "Trường Trung học Pháp thuật là---",
              to: "/vi/wiki/Mahouka_Koukou_no_Rettousei_-_Vol_1_M%E1%BB%9F_%C4%91%E1%BA%A7u"
            },
            {
              name: "Chương 0",
              id: "Chương 0",
              to: "/vi/wiki/Mahouka_Koukou_no_Rettousei_-_Vol_1_Ch%C6%B0%C6%A1ng_0"
            },
            {
              name: "Chương 1",
              id: "Chương 1",
              to: "/vi/wiki/Mahouka_Koukou_no_Rettousei_-_Vol_1_Ch%C6%B0%C6%A1ng_1"
            },
            {
              name: "Chương 2",
              id: "Chương 2",
              to: "/vi/wiki/Mahouka_Koukou_no_Rettousei_-_Vol_1_Ch%C6%B0%C6%A1ng_2"
            },
            {
              name: "Chương 3",
              id: "Chương 3",
              to: "/vi/wiki/Mahouka_Koukou_no_Rettousei_-_Vol_1_Ch%C6%B0%C6%A1ng_3"
            },
            {
              name: "Chương 4",
              id: "Chương 4",
              to: "/vi/wiki/Mahouka_Koukou_no_Rettousei_-_Vol_1_Ch%C6%B0%C6%A1ng_4"
            },
            {
              name: "Chương 5",
              id: "Chương 5",
              to: "/vi/wiki/Mahouka_Koukou_no_Rettousei_-_Vol_1_Ch%C6%B0%C6%A1ng_5"
            },
            {
              name: "Lời bạt",
              id: "Lời bạt",
              to: "/vi/wiki/Mahouka_Koukou_no_Rettousei_-_Vol_1_L%E1%BB%9Di_b%E1%BA%A1t"
            },
            {
              name: "Niềm vui muộn màng",
              id: "Niềm vui muộn màng",
              to: "/vi/wiki/Mahouka_Koukou_no_Rettousei_-_Vol_1_Ni%E1%BB%81m_Vui_Mu%E1%BB%99n_M%C3%A0ng"
            }
          ].map((item, order): Volume => ({ ...item, order: order + "" }))
        })
      )

    return {
      name: "Mahouka Koukou no Rettousei",
      id: "Mahouka Koukou no Rettousei",
      books: new Map(books.map((item) => [item.id, item])) as Readonly<  Map<string, Book> >
    }
  }

  async fetchVolume(_shokugan: Book, volume: Volume) {
    return {
      id: volume.id,
      name: volume.name,
      updatedAt: Date.now() - 10 * 24 * 3600 * 1e3,
      content
    }
  }
}
export type API = Api
const api = new Api()
</script>
_shokugan_shokugan_volume
