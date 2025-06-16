<template>
  <div class="inline-flex flex-nowrap items-center">
    <q-btn
      rounded
      unelevated
      :style="{ backgroundColor: bg }"
      @click="emit('update:modelValue', Math.max(min, modelValue - step))"
    >
      <slot name="icon-left" />
    </q-btn>

    <span class="mx-2 lg:mx-4 font-weight-light">
      <slot />
    </span>

    <q-btn
      rounded
      unelevated
      :style="{ backgroundColor: bg }"
      class="bg-inherit bg-opacity-50"
      @click="emit('update:modelValue', Math.min(max, modelValue + step))"
    >
      <slot name="icon-right" />
    </q-btn>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  bg: string

  modelValue: number
  step: number
  min: number
  max: number
}>()
const emit = defineEmits<{
  (name: "update:modelValue", value: number): void
}>()
</script>
