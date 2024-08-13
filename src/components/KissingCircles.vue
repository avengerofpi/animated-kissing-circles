<template>
  <!-- Header -->
  <h3>{{ title }}</h3>
  <!-- Buttons -->
  <div>
    <button type="button" @click="regenerateCircles" :disabled=animating>Regenerate Circles</button>
    <button v-if="!animating && !stopAnimationFlag" type="button" @click="animate">Animate Circles</button>
    <button v-if="animating || stopAnimationFlag" type="button" @click="stopAnimationAfterCurrentStep" :disabled="stopAnimationFlag">
      <span v-if="!stopAnimationFlag">Stop Animation</span>
      <span v-if="stopAnimationFlag">Pending Stop...</span>
    </button>
  </div>
  <!-- Basic input -->
  <div>
    <!-- Number of circles -->
    <div>
      <label for="nInput">Number of Circles:</label>
      <input id="nInput" v-model.number.lazy="numCirclesRef">
      <button @click="decrementNumCircles()">
        Decrement
      </button>
      <button @click="incrementNumCircles()">
        Increment
      </button>
    </div>
    <!-- Animation speed -->
    <div>
      <label for="animationTimeInput">Animation cycles per minute</label>
      <input id="animationTimeInput" v-model.number.lazy="animationCyclesPerMinuteRef">
      <button @click="decrementAnimationSpeed()">
        Decrease speed
      </button>
      <button @click="incrementAnimationSpeed()">
        Increase speed
      </button>
    </div>
  </div>
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
  title,
  numCirclesRef,
  regenerateCircles,
  animationCyclesPerMinuteRef,
  animating,
  stopAnimationFlag,
  stopAnimationAfterCurrentStep,
  stepAtLeastOnce,
  animate,
  addShapes,
  addDebugShapes,
} from './generators/centers-moving-along-circular-paths'

const toggleAnimating: Ref<Function> = ref(_toggleAnimating)

onMounted(() => {
})

function incrementNumCircles() {
  numCirclesRef.value++
}

function decrementNumCircles() {
  numCirclesRef.value--
  numCirclesRef.value = Math.max(0, numCirclesRef.value)
}

const animationSpeedStepSizes = [1, 0.1, 0.01, 0.001]
const numAnimationSpeedStepSizes = animationSpeedStepSizes.length

function incrementAnimationSpeed() {
  for (const stepSize of animationSpeedStepSizes) {
    if (animationCyclesPerMinuteRef.value >= stepSize) {
      animationCyclesPerMinuteRef.value += stepSize
      break
    }
  }
  animationCyclesPerMinuteRef.value = Math.max(animationSpeedStepSizes[numAnimationSpeedStepSizes-1], animationCyclesPerMinuteRef.value)
  animationCyclesPerMinuteRef.value = Number(animationCyclesPerMinuteRef.value.toFixed(4))
}

function decrementAnimationSpeed() {
  for (const stepSize of animationSpeedStepSizes) {
    if (animationCyclesPerMinuteRef.value >= 2 * stepSize) {
      animationCyclesPerMinuteRef.value -= stepSize
      break
    }
  }
  animationCyclesPerMinuteRef.value = Math.max(animationSpeedStepSizes[numAnimationSpeedStepSizes-1], animationCyclesPerMinuteRef.value)
  animationCyclesPerMinuteRef.value = Number(animationCyclesPerMinuteRef.value.toFixed(4))
}

function _toggleAnimating() {
  if (animating.value) {
    stopAnimationAfterCurrentStep()
  } else {
    animate()
  }
}


</script>

<style scoped>
</style>
