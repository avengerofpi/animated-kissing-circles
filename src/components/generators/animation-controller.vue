<template>
  <!-- Buttons -->
  <div>
    <button type="button" @click="circleGenerator.regenerateShapes" :disabled=animating>Regenerate Shapes</button>
    <button type="button" @click="_toggleAnimating" :disabled="stopAnimationFlag">
      <span v-if="!animating && !stopAnimationFlag">Animate Circles</span>
      <span v-else-if="!stopAnimationFlag">Stop Animation</span>
      <span v-else>Pending Stop...</span>
    </button>
  </div>
  <div>
    <!-- for each generator, do the generator's control element -->
  </div>
</template>

<script setup lang="ts">
// https://vuejs.org/guide/typescript/composition-api
// defineProps<{}>()

import { Coor } from '@/models/coor'
import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import { ConstellationGenerator } from '@/models/generator'
import { generator } from '@/components/generators/centers-moving-along-circular-paths'

const animating: Ref<boolean> = ref(false)
const stopAnimationFlag: Ref<boolean> = ref(false)
const stepAtLeastOnce: Ref<boolean> = ref(true)
// const generators: ConstellationGenerator[] = []
// const generator: Ref<ConstellationGenerator | null> = ref(null)
const animationCyclesPerMinuteRef: Ref<number> = ref(3)

let startTimestamp: number
let pauseTimestamp: number
const addShapes: Ref<Function> = ref(_addShapes)

let initialized = false
let height: number
let width: number
let canvasCenter: Coor

watch(animationCyclesPerMinuteRef, (newSpeed: number, oldSpeed: number) => {
  const numCyclesSinceStart = (pauseTimestamp - startTimestamp) * oldSpeed / 60000
  const newStartTimestamp = pauseTimestamp - (numCyclesSinceStart * 60000) / newSpeed

  startTimestamp = newStartTimestamp
  stepAtLeastOnce.value = true
})

function initCanvas(ctx: CanvasRenderingContext2D, timestamp: number) {
  height = ctx.canvas.height;
  width = ctx.canvas.width;
  initialized = true;

  canvasCenter = new Coor(0, 0)
  generator.regenerateShapes()
}

function addDebugShapes(ctx: CanvasRenderingContext2D) {
  generator.addDebugShapes(ctx)
}

function animate() {
  animating.value = true
  stopAnimationFlag.value = false
  // Identical to `timeStamp` used in `window.requestAnimationFrame`
  const ellapsedOffset = pauseTimestamp - startTimestamp
  startTimestamp = (document.timeline.currentTime as number) - ellapsedOffset;
}

function _addShapes(ctx: CanvasRenderingContext2D, timestamp: number) {
  // console.log(`running _addShapes`)
  initialized || initCanvas(ctx, timestamp)

  let elapsed: number
  if (animating.value) {
    pauseTimestamp = timestamp
    elapsed = timestamp - startTimestamp
  } else if (stepAtLeastOnce.value) {
    elapsed = pauseTimestamp - startTimestamp
  } else {
    throw new Error(`_addShapes should not have been called`)
  }

  // Loop animation, instead of stop animation after an animation cycle
  const millisecondsPerMinute: number = 60000
  const numCycles = elapsed * generator.animationCyclesPerMinuteRef.value / millisecondsPerMinute

  if (stopAnimationFlag.value) {
    stopAnimationFlag.value = false
    animating.value = false
  }

  return
}

export {
  animating,
  stopAnimationFlag,
  stepAtLeastOnce,
  animate,
  addShapes,
  addDebugShapes,
}

</script>