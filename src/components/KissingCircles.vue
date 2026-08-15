<template>
  <!-- Header -->
  <h3>{{ circleGenerator.title }}</h3>
  <!-- Buttons -->
  <div>
    <AnimationController>
    </AnimationController>
  </div>
  <!-- Shapes/Generator Chooser -->
  <!-- Canvas -->
  <BaseCanvas
    v-model:animating="animating"
    v-model:toggle-animating="toggleAnimating"
    v-model:add-shapes="addShapes"
    v-model:add-debug-shapes="addDebugShapes"
    v-model:step-at-least-once="stepAtLeastOnce"
  >
  </BaseCanvas>
</template>

<script setup lang="ts">
// https://vuejs.org/guide/typescript/composition-api
// defineProps<{}>()

import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'

import BaseCanvas from './BaseCanvas.vue';
import AnimationController from '@/components/generators/AnimationController.vue'
import {
  animating,
  stopAnimationFlag,
  stepAtLeastOnce,
  animate,
  addShapes,
  addDebugShapes,
} from '@/components/generators/AnimationController'

const toggleAnimating: Ref<Function> = ref(_toggleAnimating)

onMounted(() => {
})

</script>

<style scoped>
</style>
