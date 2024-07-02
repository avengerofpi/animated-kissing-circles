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
    :animating="animating"
    v-model:add-shapes="addShapes"
    v-model:add-debug-shapes="addDebugShapes"
    v-model:step-at-least-once="stepAtLeastOnce"
  >
  </BaseCanvas>
</template>

<script setup lang="ts">
// https://vuejs.org/guide/typescript/composition-api
// defineProps<{}>()

import { onMounted } from 'vue'

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

onMounted(() => {
})

function incrementNumCircles() {
  numCirclesRef.value++
}

function decrementNumCircles() {
  numCirclesRef.value--
  numCirclesRef.value = Math.max(0, numCirclesRef.value)
}

function incrementAnimationSpeed() {
  animationCyclesPerMinuteRef.value++
}

function decrementAnimationSpeed() {
  animationCyclesPerMinuteRef.value--
  animationCyclesPerMinuteRef.value = Math.max(1, animationCyclesPerMinuteRef.value)
}


</script>

<style scoped>
</style>
