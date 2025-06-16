<template>
  <BottomSheet
    ref="settingsRef"
    :max-height="$q.screen.height * 0.8"
    :min-height="$q.screen.height * 0.7"
    :content-color="theme.bg"
  >
    <q-card class="transparent pb-58px" flat :style="{ color: theme.color }">
      <q-card-section>
        <label class="text-12px">Label</label>
        <div class="flex items-center justify-around">
          <ButtonCounter
            v-model="fontSize"
            :step="1"
            :min="12"
            :max="34"
            :bg="theme.lighten"
          >
            <template #icon-left>
              <i-mdi-format-font-size-decrease class="size-1.2em" />
            </template>
            <template #icon-right>
              <i-mdi-format-font-size-increase class="size-1.2em" />
            </template>
            {{ Math.round(fontSize) }}
          </ButtonCounter>

          <ButtonCounter
            v-model="lineHeight"
            :step="0.2"
            :min="1.2"
            :max="2"
            :bg="theme.lighten"
          >
            <template #icon-left>
              <i-majesticons-line-height class="size-1.2em" />
            </template>
            <template #icon-right>
              <i-tdesign-line-height class="size-1.2em" />
            </template>
            {{ Math.round(lineHeight * 10) / 10 }}
          </ButtonCounter>
        </div>

        <label class="text-12px">Mode page effect</label>
        <div class="children:mx-2">
          <span v-for="item in effects" :key="item.mode" @click="effect = item">
            <q-btn
              rounded
              unelevated
              no-caps
              :color="effect === item ? theme.lighten : undefined"
              :style="{ color: theme.color }"
              class="my-1.5 min-h-0 border border-solid border-light-100 border-opacity-10"
              >{{ item.name }}</q-btn
            >
          </span>
        </div>

        <label class="text-12px">Background color</label>
        <div class="children:mx-2">
          <q-btn
            v-for="(item, i) in themes"
            :key="item.bg"
            @click="theme = item"
            rounded
            unelevated
            no-caps
            :style="{ backgroundColor: item.bg }"
            class="px-7 py-3.5 my-1.5 min-h-0 border border-solid border-light-100 border-opacity-10"
          >
            <i-iconamoon-check-bold
              v-if="item === theme"
              class="size-1.5em absolute top-1/2 left-1/2 translate--1/2"
              :style="{ color: item.color }"
            />
            <i-ph-moon-fill
              v-else-if="i === themes.length - 1"
              class="size-1.5em absolute top-1/2 left-1/2 translate--1/2"
            />
          </q-btn>
        </div>

        <label class="text-12px">Font</label>
        <div class="children:mx-2">
          <q-btn
            v-for="font in fonts"
            :key="font.value"
            @click="fontFamily = font"
            rounded
            unelevated
            no-caps
            :color="font === fontFamily ? theme.lighten : undefined"
            :style="{ fontFamily: font }"
            class="my-1.5 min-h-0 border border-solid border-light-100 border-opacity-10"
          >
            {{ font.name }}
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </BottomSheet>
</template>

<script lang="ts" setup>
import BottomSheet from "../bottom-sheet.vue"
import type { Effect, Font, Theme } from "../index.vue"

defineProps<{
  effects: Effect[]
  themes: Theme[]
  fonts: Font[]
}>()

const fontSize = defineModel<number>("fontSize", { required: true })
const lineHeight = defineModel<number>("lineHeight", { required: true })
const theme = defineModel<Theme>("theme", { required: true })
const fontFamily = defineModel<Font>("fontFamily", { required: true })
const effect = defineModel<Effect>("effect", { required: true })

const settingsRef = ref<InstanceType<typeof BottomSheet>>()

defineExpose({
  sheet: settingsRef
})
</script>
