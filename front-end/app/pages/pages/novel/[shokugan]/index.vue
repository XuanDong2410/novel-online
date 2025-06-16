<!-- <route lang="yaml">
meta:
  hiddenHeader: true
</route> -->

<template>
  <ClientOnly>
  <q-header class="transparent">
    <q-toolbar>
      <q-btn flat unelevated round>
        <i-quill-arrow-left class="text-1.em" />
      </q-btn>
    </q-toolbar>
  </q-header>

  <q-page class="min-h-100% px-4">
    <div class="bg-app z--1" />

    <div class="flex flex-nowrap">
      <div class="min-w-30% w-30% max-w-180px">
        <q-img
          src="https://static.wikia.nocookie.net/sonako/images/8/83/MKnR_v01_cover.jpg/revision/latest/scale-to-width-down/150?cb=20120926052322"
          no-spinner
          class="w-full rounded-md"
        />
      </div>
      <div class="ml-3 min-w-0 py-1">
        <h1 class="text-h6 line-clamp-2 text-18px text-white leading-normal">
          Mahouka Koukou no Rettousei
        </h1>
        <h2 class="text-base !text-12px text-gray-300 truncate">
          魔法科高校の劣等生 &bull; The Irregular At Magic High School &bull;
          Onii-sama is the best
        </h2>
        <div class="mt-3 text-12px text-gray-300 table">
          <div class="table-row">
            <span class="table-cell pr-2">Tác giả</span>
            <span class="table-cell text-white">Satou Tsutomu (佐島勤)</span>
          </div>
          <div class="table-row">
            <span class="table-cell pr-2">Minh họa</span>
            <span class="table-cell text-white">Ishida Kana (石田可奈)</span>
          </div>
        </div>
      </div>
    </div>

    <div class="section !mt-6 row px-4 items-center justify-around text-center">
      <div class="col-3 font-bold">
        <div class="text-gray-300 font-normal text-12px">Tình trạng</div>
        Tạm ngưng
      </div>

      <div class="col-3 font-bold">
        <div class="text-gray-300 font-normal text-12px">Lượt xem</div>
        1.205.737
      </div>

      <div class="col-3 font-bold">
        <div class="text-gray-300 font-normal text-12px">Số từ</div>
        377.800
      </div>

      <div class="col-3 font-bold">
        <div class="text-gray-300 font-normal text-12px">Cập nhật</div>
        4 năm
      </div>
    </div>

    <div class="section transparent">
      Pháp thuật. Nó không phải sản phẩm của thần thoại hay truyền thuyết, mà là
      một kỹ thuật khoa học hiện đại đã được phát triển gần một thế kỷ tính cho
      đến giờ.
    </div>

    <div class="section transparent">
      <div class="text-base text-16px font-medium">Dich gia</div>
      <div class="flex flex-nowrap mt-2">
        <q-avatar size="35px">
          <q-img
            no-spinner
            src="https://i.docln.net/lightnovel/users/ua17883-f844b245-7977-4de8-a316-9239239d69a7.jpg"
          />
        </q-avatar>

        <div class="ml-2">
          Thiên hi
          <div class="text-gray-400 text-12px">
            <div class="long-text" style="word-wrap: break-word">
              <p>
                Translated by
                <a href="../../../thanh-vien/17883">Thiên Hi</a>
              </p>
              <p>
                Link vol 1 đến vol 20 của Sonako:
                <a
                  href="http://sonako.wikia.com/wiki/Mahouka_Koukou_no_Rettousei"
                  rel="nofollow noreferrer noopener"
                  target="_blank"
                  >Mahouka Koukou No Rettousei</a
                >
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="text-base text-16px font-medium">Binh luan</div>
    <swiper :slides-per-view="1.2" :space-between="16">
      <swiper-slide v-for="item in 20" :key="item">
        <Comment class="bg-#212121 py-3 px-3 rounded-20px" />
      </swiper-slide>
    </swiper>
  </q-page>

  <BottomSheet
    :min-height="$q.screen.height * 0.9"
    ref="tocRef"
    content-color="#333333"
  >
    <q-list>
      <q-expansion-item
        v-for="[, book] in data?.books"
        :key="book.id"
        :content-inset-level="0.25"
        expand-separator
        default-opened
      >
        <template #header>
          <q-item-section>
            <q-img no-spinner :src="book.image" class="w-5em rounded-md" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ book.name }}</q-item-label>
          </q-item-section>
        </template>

        <q-item
          v-for="item in book.vols"
          :key="item.id"
          clickable
          v-ripple
          class="rounded-20px mx-2"
        >
          <q-item-section side>{{ item.order }}</q-item-section>
          <q-item-section>
            <q-item-label lines="1">{{ item.name }}</q-item-label>
            <q-item-label lines="1" caption>{{ item.updatedAt }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-expansion-item>
    </q-list>
  </BottomSheet>

  <q-footer class="transparent px-2 py-2">
    <q-toolbar class="rounded-15px bg-dark py-1">
      <q-btn flat round unelevated @click="tocRef?.open()">
        <i-quill-list class="text-1.2em" />
      </q-btn>

      <q-btn flat round unelevated>
        <i-uil-comment-dots class="text-1.2em" />
      </q-btn>

      <q-btn class="ml-2 w-full bg-blue-500" rounded unelevated no-caps
        >Đọc tiếp Volume 1</q-btn
      >
    </q-toolbar>
  </q-footer>

</ClientOnly>
</template>

<script lang="ts" setup>
import BottomSheet from "~/components/ln-reader/bottom-sheet.vue"
import type { Book, Volume } from "~/components/ln-reader/index.vue"
import { Swiper, SwiperSlide } from "swiper/vue"
import { useRequest } from "vue-request"
import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/virtual"
definePageMeta({
  layout: "main",
  meta: {
    hiddenHeader: true
  }
})
// eslint-disable-next-line functional/no-classes
class Api {
  async fetchShokugan(_shokugan: string) {
    const books = Array(10)
      .fill(0)
      .map(
        (_, i): Book => ({
          id: "tap-1-nhap-hoc-i" + i,
          name: `Tập ${i} - Nhập học (I)`,
          image:
            "https://static.wikia.nocookie.net/sonako/images/8/83/MKnR_v01_cover.jpg/revision/latest/scale-to-width-down/150?cb=20120926052322",
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
      books: new Map(books.map((item) => [item.id, item])) as Readonly<
        Map<string, Book>
      >
    }
  }
}

const api = new Api()

const { data } = useRequest(() => api.fetchShokugan())

const tocRef = ref<InstanceType<typeof BottomSheet>>()
</script>

<style lang="scss" scoped>
.bg-app {
  @apply fixed top-0 left-0 w-full h-40%;
  background: {
    image: linear-gradient(
      to bottom,
      /* rgb(128, 128, 128) 10%, */ rgba(132, 132, 132, 1),
      rgba(18, 18, 18, 0.5)
    );
  }
}

.section {
  @apply mt-3 rounded-20px bg-#212121 py-4;
}
</style>
import { Book, Volume } from "src/components/ln-reader/index.vue"
