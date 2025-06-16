<script setup lang="ts">
const _categories = ['sexual', 'violence', 'self-harm', 'illicit', 'hate'] as const
type Category = typeof _categories[number]

const props = defineProps<{
  category: Category
  active: boolean
}>()

const icons: Record<Category, string> = {
  'sexual': 'i-heroicons-heart',
  'violence': 'i-heroicons-fire',
  'self-harm': 'i-heroicons-shield-exclamation',
  'illicit': 'i-heroicons-ban',
  'hate': 'i-heroicons-x-circle'
}
</script>

<template>
  <UIcon
    :name="icons[props.category] || 'i-heroicons-question-mark-circle'"
    class="h-5 w-5"
    :class="{ 'text-red-500': active, 'text-gray-300': !active }"
  />
</template>
