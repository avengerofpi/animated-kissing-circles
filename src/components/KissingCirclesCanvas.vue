<template>
  <h1 class="green">{{ msg }}, now bugger off</h1>
  <button type="button" @click="regenerate" :disabled=animating>Regenerate Circles</button>
  <button type="button" @click="animate" :disabled=animating>Animate Circles</button>
  <button type="button" @click="stopAnimationAfterCurrentSet" :disabled="!animating || stopAnimationFlag">
    <span v-if="!stopAnimationFlag">Stop Animation</span>
    <span v-if="stopAnimationFlag">Pending Stop...</span>
  </button>
  <div>
    <canvas ref="canvasRef" width="900" height="600" style="border:1px solid #d3d3d3;"></canvas>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  msg: string
}>()

import { ref, onMounted } from 'vue'

const canvasRef = ref(null)
const ctxRef = ref(null)
const centersRef = ref([])
const n = 6;
const nextCentersRef = ref([])
const animating = ref(false)
const stopAnimationFlag = ref(false)
const animationTime = 2000 // milliseconds
let start: number, previousTimeStamp: number;

onMounted(() => {
  ctxRef.value = canvasRef.value.getContext("2d") as CanvasRenderingContext2D;

  generateCircles()
})

function generateCircles() {
  const centers = generateCenters()
  centersRef.value = centers
  renderKissingCircles(centers);
}

function renderKissingCircles(centers: any[]) {
  const ctx: CanvasRenderingContext2D = ctxRef.value as CanvasRenderingContext2D
  ctx.reset()
  for (let i=0; i<n; i++) {
    let a = centers[i]
    let r = Number.MAX_SAFE_INTEGER
    let dstCenter: any[] = a
    for (let j=0; j<n; j++) {
      if (i === j) continue;
      let b = centers[j]
      let rNext = dist(a, b) / 2
      if (rNext < r) {
        r = rNext
        dstCenter = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
      }
    }
    ctx.beginPath();
    ctx.arc(a[0], a[1], r ,0,2*Math.PI);
    // ctx.strokeText(parseInt(r.toString()), a[0]-5, a[1])
    ctx.stroke();
    // Add line segment pointing to nearest neighbor
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(dstCenter[0], dstCenter[1])
    ctx.stroke();
  }
}

function generateCenters(): any[] {
  const ctx: CanvasRenderingContext2D = ctxRef.value as CanvasRenderingContext2D
  const height = ctx.canvas.height;
  const width = ctx.canvas.width;

  const centers: any[] = []
  if (n <= 0) return centers;

  const boarderSize = Math.max(height, width) / 10
  const xMax = width - 2*boarderSize
  const yMax = height - 2*boarderSize

  for (let i=0; i<n; i++) {
    let x: number = boarderSize + xMax*Math.random()
    let y: number = boarderSize + yMax*Math.random()
    centers.push([x, y])
  }
  return centers;
}

function dist(a: number[], b: number[]) {
  return Math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)
}

function regenerate() {
  const ctx: CanvasRenderingContext2D = ctxRef.value as CanvasRenderingContext2D
  ctx.reset()
  generateCircles()
}

function animate() {
  stopAnimationFlag.value = false
  nextCentersRef.value = generateCenters()
  animating.value = true
  // Identical to `timeStamp` used in `window.requestAnimationFrame`
  start = document.timeline.currentTime as number;
  previousTimeStamp = 0
  window.requestAnimationFrame(step);
}

function step(timeStamp: number) {
  const elapsed = timeStamp - start;

  const stepSize = Math.min(1, elapsed / animationTime)
  if (elapsed > 0 && timeStamp !== previousTimeStamp) {
    let newCenters: any[] = []
    for (let i=0; i<n; i++) {
      const x = centersRef.value[i][0] + (nextCentersRef.value[i][0] - centersRef.value[i][0]) * stepSize
      const y = centersRef.value[i][1] + (nextCentersRef.value[i][1] - centersRef.value[i][1]) * stepSize
      newCenters.push([x, y])
    }
    renderKissingCircles(newCenters)
  }

  if (elapsed < animationTime) {
    previousTimeStamp = timeStamp;
    window.requestAnimationFrame(step);
  } else {
    animating.value = false
    centersRef.value = nextCentersRef.value
    if (!stopAnimationFlag.value) {
      animate()
    } else {
      stopAnimationFlag.value = false;
    }
  }
}

function stopAnimationAfterCurrentSet() {
  stopAnimationFlag.value = true
}

</script>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}
</style>
