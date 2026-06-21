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
import {
  generator as circleGenerator,
  // title,
  // numCirclesRef,
  // regenerateShapes,
  // animationCyclesPerMinuteRef,
  // addShapes,
  // addDebugShapes,
} from '@/components/generators/centers-moving-along-circular-paths.vue'
import animationControllerVue, {
  animating,
  stopAnimationFlag,
  stepAtLeastOnce,
  animate,
  addShapes,
  addDebugShapes,
} from '@/components/generators/animation-controller.vue'

const toggleAnimating: Ref<Function> = ref(_toggleAnimating)

onMounted(() => {
})

const animationSpeedStepSizes = [1, 0.1, 0.01, 0.001]
const numAnimationSpeedStepSizes = animationSpeedStepSizes.length

function incrementAnimationSpeed() {
  for (const stepSize of animationSpeedStepSizes) {
    if (circleGenerator.animationCyclesPerMinuteRef.value >= stepSize) {
      circleGenerator.animationCyclesPerMinuteRef.value += stepSize
      break
    }
  }
  circleGenerator.animationCyclesPerMinuteRef.value = Math.max(animationSpeedStepSizes[numAnimationSpeedStepSizes-1], generator.animationCyclesPerMinuteRef.value)
  circleGenerator.animationCyclesPerMinuteRef.value = Number(circleGenerator.animationCyclesPerMinuteRef.value.toFixed(4))
  // generator.animationCyclesPerMinuteRef.value = circleGenerator.animationCyclesPerMinuteRef.value.toFixed(4) as number
}

function decrementAnimationSpeed() {
  for (const stepSize of animationSpeedStepSizes) {
    if (circleGenerator.animationCyclesPerMinuteRef.value >= 2 * stepSize) {
      circleGenerator.animationCyclesPerMinuteRef.value -= stepSize
      break
    }
  }
  circleGenerator.animationCyclesPerMinuteRef.value = Math.max(animationSpeedStepSizes[numAnimationSpeedStepSizes-1], generator.animationCyclesPerMinuteRef.value)
  circleGenerator.animationCyclesPerMinuteRef.value = Number(circleGenerator.animationCyclesPerMinuteRef.value.toFixed(4))
}

function _toggleAnimating() {
  if (animating.value) {
    stopAnimationFlag.value = true
  } else {
    animate()
  }
}

</script>

<style scoped>
</style>
