<template>
  <BottomSheet
    ref="moreRef"
    :max-height="$q.screen.height * 0.8"
    :min-height="$q.screen.height * 0.7"
    :content-color="theme.bg"
    @closed="showListBook=false"
  >
    <q-card
      class="transparent pb-58px"
      flat
      :style="{
        color: theme.color
      }"
    >
      <q-card-section class="backdrop-blur-12px">
        <div
        class="rounded-20px bg-cover bg-center"
          :style="{
            backgroundImage: `url(${currentBook.image})`
          }"
        >
          <div
            class="rounded-20px px-4 py-3 bg-opacity-60 backdrop-blur-10px"
            :style="{
              backgroundColor: hexToRgb(theme.darken)
            }"
          >
            <h1 class="text-h6 text-base truncate">{{ currentBook.name }}</h1>
            <h1 class="text-h6 text-caption text-gray-300 truncate">
              {{ Math.round((currentPage / maxPage) * 100) }}% ~
              {{ currentChap.name }}
            </h1>

            <div class="flex flex-nowrap items-center justify-between">
              <q-btn
                flat
                unelevated
                round
                :disable="!canPrev"
                @click="emit('click:prev')"
              >
                <i-majesticons-chevron-left class="size-1.5em" />
              </q-btn>

              <q-slider
                v-model="currentPage"
                :step="1"
                :min="1"
                :max="maxPage"
                class="min-w-0 w-full"
              />

              <q-btn
                flat
                unelevated
                round
                :disable="!canNext"
                @click="emit('click:next')"
              >
                <i-majesticons-chevron-right class="size-1.5em" />
              </q-btn>
            </div>
          </div>
        </div>

        <div class="row mt-3">
          <div class="col-6 pr-1">
            <div
              class="relative rounded-20px flex flex-nowrap items-center px-4 py-3 max-w-300px cursor-pointer transition-background-color hover:bg-opacity-50"
              :style="{
                backgroundColor: hexToRgb(theme.darken)
              }"
              @click="showListBook = true"
            >
            <v-icon class="size-1.8em" icon="mdi-view-headline"  />
            <!-- <q-icon class="size-1.8em" name="i-ph-list-bold"  /> -->
              <div class="pl-2">
                <div class="">Nội dung</div>
                <div class="opacity-50">
                  {{ currentBook?.vols.length ?? "__" }} chương
                </div>
              </div>
            </div>
          </div>

          <div class="col-6 pl-1">
            <div
              class="rounded-20px flex flex-nowrap items-center px-4 py-3 max-w-300px cursor-pointer transition-background-color hover:bg-opacity-50"
              :style="{
                backgroundColor: hexToRgb(theme.darken)
              }"
              @click="showInfoSeries = true "
            >
              <div class="w-1.8em">
                <q-img
                  no-spinner
                  :src="currentBook?.image"
                  class="w-full rounded-md"
                />
              </div>

              <div
                class="flex flex-nowrap pl-2 min-h-3em min-w-0 w-full items-center justify-between"
              >
                Về tập sách này
                <i-majesticons-chevron-right class="text-1.2em" />
              </div>
            </div>
          </div>
        </div>

        <div class="row mt-3 justify-around">
          <q-btn
            class="rounded-20px"
            :style="{
              backgroundColor: theme.darken
            }"
          >
            <v-icon icon="mdi-headphones" class="text-1.5em" />
          <!-- <q-icon name="i-fluent-headphones-sound-wave-24-regular" class="text-1.5em" /> -->
          </q-btn>

          <q-btn
            class="rounded-20px"
            :style="{
              backgroundColor: theme.darken
            }"
          >
            <v-icon icon="mdi-translate" class="text-1.5em" />
          <!-- <q-icon name="i-fluent-translate-auto-24-regular" class="text-1.5em" /> -->
          </q-btn>

          <q-btn
            class="rounded-20px"
            :style="{
              backgroundColor: theme.darken
            }"
           
          >
           <v-icon icon="mdi-download" class="text-1.5em" />
          <!-- <q-icon icon="mdi-light-download" class="text-1.5em" /> -->
            <!-- <v-icon name="i-fluent-arrow-download-24-regular" class="text-1.5em" /> -->
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </BottomSheet>

  <q-drawer
    v-model="showListBook"
    show-if-above
    :width="~~($q.screen.width * 0.7)"
    :breakpoint="700"
  >
    <q-list>
      <q-expansion-item
        v-for="[, book] in books"
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
          :active="currentChap === item"
          class="rounded-20px mx-2"
          @click="currentChap = item"
        >
          <q-item-section side>{{ item.order }}</q-item-section>
          <q-item-section>
            <q-item-label lines="1">{{ item.name }}</q-item-label>
            <q-item-label lines="1" caption>{{ item.updatedAt }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-expansion-item>
    </q-list>
  </q-drawer>
</template>

<script lang="ts" setup>
import BottomSheet from "../bottom-sheet.vue"
import type { Book, Theme, Volume } from "../index.vue"
import { hexToRgb } from "../logic/hex-to-rgb"

defineProps<{
  theme: Theme

  maxPage: number

  canPrev: boolean
  canNext: boolean

  books: Map<string, Book>

  currentBook: Book
}>()
const emit = defineEmits<{
  (name: "click:prev" | "click:next"): void
}>()

const currentPage = defineModel<number>("currentPage", { required: true })
const currentChap = defineModel<Volume>("chap", { required: true })

const moreRef = ref<InstanceType<typeof BottomSheet>>()

defineExpose({
  sheet: moreRef
})

const showListBook = ref(false)
const showInfoSeries = ref(false)
</script>

<style lang="scss" scoped>
.this-book {
  @apply relative;
  &:before {
    content: "";
    @apply absolute top-0 left-0 size-100% z--1;
    background: {
      size: cover;
      image: var(--bg-src);
    }
    filter: blur(10px);
  }
}
</style>
