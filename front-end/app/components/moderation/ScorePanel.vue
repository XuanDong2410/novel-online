<script setup lang="ts">
import type { CategoryScores } from '~/types/moderationType'

defineProps<{
  scores: CategoryScores
}>()

const getColor = (score: number) => {
  if (score > 0.8) return 'bg-red-500'
  if (score > 0.5) return 'bg-orange-500'
  if (score > 0.2) return 'bg-yellow-500'
  return 'bg-green-500'
}
</script>

<template>
  <UCard>
    <div class="grid grid-cols-2 gap-2">
      <div v-for="(score, category) in scores" :key="category" class="flex items-center">
        <span class="w-1/2">{{ category }}</span>
        <div class="w-1/2">
          <div :class="getColor(score)" class="h-2 rounded" :style="{ width: `${score * 100}%` }" />
          <span>{{ score.toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </UCard>
</template>
