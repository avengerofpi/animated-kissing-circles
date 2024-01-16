<template>
  <h1 class="green">{{ msg }}, now bugger off</h1>
  <button type="button" @click="regenerate">Regenerate Circles</button>
  <button type="button" @click="animate">Animate Circles</button>
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
const n = 50;

onMounted(() => {
  console.dir(canvasRef.value)
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
  for (let i=0; i<n; i++) {
    let a = centers[i]
    let r = Number.MAX_SAFE_INTEGER
    for (let j=0; j<n; j++) {
      if (i === j) continue;
      let b = centers[j]
      r = Math.min(r, dist(a, b) / 2)
    }
    ctx.beginPath();
    ctx.arc(a[0], a[1], r ,0,2*Math.PI);
    // ctx.strokeText(parseInt(r.toString()), a[0]-5, a[1])
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
  const ctx: CanvasRenderingContext2D = ctxRef.value as CanvasRenderingContext2D
  const srcCenters = centersRef.value
  const dstCenters: any[] = generateCenters()
  const stepSizes: any[] = []
  const numSteps = 100
  for (let i=0; i<n; i++) {
    let xStepSize = dstCenters[i][0]
    xStepSize = xStepSize - srcCenters[i][0]
    xStepSize = xStepSize / numSteps
    let yStepSize = (dstCenters[i][1] - srcCenters[i][1]) / numSteps
    stepSizes.push([xStepSize, yStepSize])
  }
  console.dir(stepSizes)
  // Direct ref, not a copy, overwriting!
  let newCenters = srcCenters
  for (let j=0; j<numSteps; j++) {
    setTimeout(() => {
      for (let i=0; i<n; i++) {
        newCenters[i][0] += stepSizes[i][0]
        newCenters[i][1] += stepSizes[i][1]
      }
      renderKissingCircles(newCenters)
    }, 150)
  }
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
