<template>
  <h1 class="green">{{ msg }}, now bugger off</h1>
  <button type="button" @click="regenerate" :disabled=animating>Regenerate Circles</button>
  <button type="button" @click="animate" :disabled=animating>Animate Circles</button>
  <button type="button" @click="stopAnimationAfterCurrentStep" :disabled="!animating || stopAnimationFlag">
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
import type { Ref } from 'vue'

const n = 6;
const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)
const ctxRef: Ref<CanvasRenderingContext2D | null> = ref(null)
const srcCentersRef: Ref<Coor[]> = ref([])
const dstCentersRef: Ref<Coor[]> = ref([])
const currCentersRef: Ref<Coor[]> = ref([])
const animating: Ref<boolean> = ref(false)
const stopAnimationFlag: Ref<boolean> = ref(false)
const animationTime: number = 2000 // milliseconds
let start: number
let previousTimeStamp: number;

class Coor {
  x: number
  y: number

  public constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

onMounted(() => {
  if (canvasRef.value) {
    ctxRef.value = canvasRef.value.getContext("2d");
    generateCircles()
  } else {
    console.error('ERROR! Canvas element not available after mount.')
  }

})

function generateCircles() {
  const centers: Coor[] = generateCenters()
  srcCentersRef.value = centers
  renderKissingCircles(centers);
}

function renderKissingCircles(centers: Coor[]) {
  const ctx: CanvasRenderingContext2D = ctxRef.value as CanvasRenderingContext2D
  ctx.reset()
  for (let i=0; i<n; i++) {
    let a: Coor = centers[i]
    let r: number = Number.MAX_SAFE_INTEGER
    let dstCenter: Coor = a
    for (let j=0; j<n; j++) {
      if (i === j) continue;
      let b: Coor = centers[j]
      let rNext: number = dist(a, b) / 2
      if (rNext < r) {
        r = rNext
        dstCenter = new Coor((a.x + b.x) / 2, (a.y + b.y) / 2)
      }
    }
    ctx.beginPath();
    ctx.arc(a.x, a.y, r ,0,2*Math.PI);
    // ctx.strokeText(parseInt(r.toString()), a[0]-5, a[1])
    ctx.stroke();
    // Add line segment pointing to nearest neighbor
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(dstCenter.x, dstCenter.y)
    ctx.stroke();
  }
}

function generateCenters(): Coor[] {
  const ctx: CanvasRenderingContext2D = ctxRef.value as CanvasRenderingContext2D
  const height = ctx.canvas.height;
  const width = ctx.canvas.width;

  const centers: Coor[] = []
  if (n <= 0) return centers;

  const boarderSize = Math.max(height, width) / 10
  const xMax = width - 2*boarderSize
  const yMax = height - 2*boarderSize

  for (let i=0; i<n; i++) {
    let x: number = boarderSize + xMax*Math.random()
    let y: number = boarderSize + yMax*Math.random()
    centers.push(new Coor(x, y))
  }
  return centers;
}

function dist(a: Coor, b: Coor): number {
  return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2)
}

function regenerate() {
  const ctx: CanvasRenderingContext2D = ctxRef.value as CanvasRenderingContext2D
  ctx.reset()
  generateCircles()
}

function animate() {
  dstCentersRef.value = generateCenters()
  animating.value = true
  // Identical to `timeStamp` used in `window.requestAnimationFrame`
  start = document.timeline.currentTime as number;
  previousTimeStamp = 0
  window.requestAnimationFrame(step);
}

function step(timeStamp: number) {
  if (stopAnimationFlag.value) {
    stopAnimationFlag.value = false
    animating.value = false
    srcCentersRef.value = currCentersRef.value
    return
  }
  const elapsed = timeStamp - start;

  const stepSize = Math.min(1, elapsed / animationTime)
  if (elapsed > 0 && timeStamp !== previousTimeStamp) {
    let newCenters: Coor[] = []
    for (let i=0; i<n; i++) {
      const x = srcCentersRef.value[i].x + (dstCentersRef.value[i].x - srcCentersRef.value[i].x) * stepSize
      const y = srcCentersRef.value[i].y + (dstCentersRef.value[i].y - srcCentersRef.value[i].y) * stepSize
      newCenters.push(new Coor(x, y))
    }
    currCentersRef.value = newCenters
    renderKissingCircles(newCenters)
  }

  if (elapsed < animationTime) {
    previousTimeStamp = timeStamp;
    window.requestAnimationFrame(step);
  } else {
    animating.value = false
    srcCentersRef.value = dstCentersRef.value
    animate()
  }
}

function stopAnimationAfterCurrentStep() {
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
