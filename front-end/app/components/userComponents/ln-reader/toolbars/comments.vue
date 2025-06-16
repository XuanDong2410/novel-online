<template>
  <BottomSheet
    ref="commentsRef"
    :max-height="$q.screen.height * 0.9"
    :min-height="$q.screen.height * 0.9"
    :content-color="theme.bg"
  >
    <q-card
      class="transparent pb-58px"
      flat
      :style="{
        color: theme.color
      }"
    >
      comments
    </q-card>
  </BottomSheet>
</template>

<script lang="ts" setup>
import BottomSheet from "../bottom-sheet.vue"
import type { Book, Theme, Volume } from "../index.vue"

defineProps<{
  theme: Theme
}>()

const commentsRef = ref<InstanceType<typeof BottomSheet>>()

defineExpose({
  sheet: commentsRef
})
</script>
