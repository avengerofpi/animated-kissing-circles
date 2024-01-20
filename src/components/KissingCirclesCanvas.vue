<template>
  <h1 class="green">{{ msg }}, now bugger off</h1>
  <div>
    <button type="button" @click="regenerateCircles" :disabled=animating>Regenerate Circles</button>
    <button type="button" @click="animate" :disabled=animating>Animate Circles</button>
    <button type="button" @click="stopAnimationAfterCurrentStep" :disabled="!animating || stopAnimationFlag">
      <span v-if="!stopAnimationFlag">Stop Animation</span>
      <span v-if="stopAnimationFlag">Pending Stop...</span>
    </button>
  </div>
  <div>
    <canvas ref="canvasRef" width="900" height="600" style="border:1px solid #d3d3d3;"></canvas>
  </div>
</template>

<script setup lang="ts">
// https://vuejs.org/guide/typescript/composition-api
defineProps<{
  msg: string
}>()

import { ref, onMounted } from 'vue'
import type { Ref } from 'vue'

const n = 6;
const animationTime: number = 2000 // milliseconds

const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)
const ctxRef: Ref<CanvasRenderingContext2D | null> = ref(null)
const srcCentersRef: Ref<Coor[]> = ref([])
const dstCentersRef: Ref<Coor[]> = ref([])
const currCentersRef: Ref<Coor[]> = ref([])
const animating: Ref<boolean> = ref(false)
const stopAnimationFlag: Ref<boolean> = ref(false)
let start: number
let previousTimeStamp: number;

class Coor {
  x: number
  y: number

  public constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  public static fromCoorPair(coorPair: number[]) {
    return new Coor(coorPair[0], coorPair[1])
  }
}

class Circle {
  center: Coor
  radius: number | undefined

  public constructor(x: number, y: number, radius: number | undefined = undefined) {
    this.center = new Coor(x, y)
    this.radius = radius
  }
}

class LineSegment {
  src: Coor
  dst: Coor

  public constructor(src: Coor, dst: Coor) {
    this.src = src
    this.dst = dst
  }

  public static fromXYXY(srcX: number, srcY: number, dstX: number, dstY: number) {
    return new LineSegment(new Coor(srcX, srcY), new Coor(dstX, dstY))
  }

  public static fromCoorXY(src: Coor, dstX: number, dstY: number) {
    return new LineSegment(src, new Coor(dstX, dstY))
  }

  public static fromXYCoor(srcX: number, srcY: number, dst: Coor) {
    return new LineSegment(new Coor(srcX, srcY), dst)
  }

  public length(): number {
    return dist(this.src, this.dst)
  }
}

class CircleWithRadiusLine {
  center: Coor
  radius: number
  radiusLine: LineSegment | undefined

  public constructor(center: Coor, radiusLineDst: Coor | undefined = undefined) {
    this.center = center
    if (radiusLineDst) {
      this.radiusLine = new LineSegment(this.center, radiusLineDst)
    } else {
      this.radiusLine = new LineSegment(this.center, this.center)
    }
    this.radius = this.radiusLine.length()
  }

  public setRadiusLineDst(radiusLineDst: Coor) {
    this.radiusLine = new LineSegment(this.center, radiusLineDst)
    this.radius = this.radiusLine.length()
  }
}

onMounted(() => {
  if (canvasRef.value) {
    ctxRef.value = canvasRef.value.getContext("2d");
    initCanvas()
  } else {
    console.error('ERROR! Canvas element not available after mount.')
  }

})

function initCanvas() {
  resetCanvasWithNewCircles()
}

function resetCanvasWithNewCircles() {
  const centers: Coor[] = generateCenters()
  srcCentersRef.value = centers

  const ctx: CanvasRenderingContext2D = ctxRef.value as CanvasRenderingContext2D
  ctx.reset()
  renderKissingCircles(centers);
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

function computeRadii(centers: Coor[]): CircleWithRadiusLine[] {
  // is there a better way to copy this array?
  const unprocessedCenters: Coor[] = new Array(...centers).reverse()
  let circlesWithRadiusLine: CircleWithRadiusLine[] = []

  while (unprocessedCenters.length) {
    const center = unprocessedCenters.pop() as Coor
    let r: number = Number.MAX_VALUE
    let dstCenter: Coor = center
    let radiusLineEndpoint: Coor = new Coor(0,0)
    // First circle will be 1/3 distance between first point and nearest point.
    if (circlesWithRadiusLine.length === 0) {
      unprocessedCenters.forEach((B) => {
        const rNext = dist(center, B)
        if (rNext < r) {
          r = rNext
          dstCenter = B
          radiusLineEndpoint = new Coor(
            center.x + (dstCenter.x - center.x) / 3,
            center.y + (dstCenter.y - center.y) / 3
          )
        }
      })
    }
    // Remaining circles will generate based on nearest existing circle
    else {
      circlesWithRadiusLine.forEach((c) => {
        const rNext = Math.abs(dist(center, c.center) - c.radius)
        if (rNext < r) {
          r = rNext
          dstCenter = c.center
          const scale = r / dist(center, c.center)
          radiusLineEndpoint = new Coor(
            center.x + (dstCenter.x - center.x) * scale,
            center.y + (dstCenter.y - center.y) * scale
          )
        }
      })
    }
    const circle: Circle = new Circle(center.x, center.y, r)
    circlesWithRadiusLine.push(new CircleWithRadiusLine(circle.center, radiusLineEndpoint))
  }

  return circlesWithRadiusLine
}

function renderKissingCircles(centers: Coor[]) {
  const circlesWithRadiusLines = computeRadii(centers)

  const ctx: CanvasRenderingContext2D = ctxRef.value as CanvasRenderingContext2D
  ctx.reset()
  
  circlesWithRadiusLines.forEach((circlesWithRadiusLine) => {
    const center = circlesWithRadiusLine.center
    const radius = circlesWithRadiusLine.radius
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0,2*Math.PI);
    // ctx.strokeText(`(${center.x.toFixed(1)}, ${center.y.toFixed(1)}), ${radius.toFixed(1)}`, center.x-5, center.y)

    // Add line segment pointing to nearest neighbor
    const radiusLine = circlesWithRadiusLine.radiusLine as LineSegment
    ctx.moveTo(radiusLine.src.x, radiusLine.src.y);
    ctx.lineTo(radiusLine.dst.x, radiusLine.dst.y)

    ctx.stroke();
  })
}

function dist(a: Coor, b: Coor): number {
  return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2)
}

function regenerateCircles() {
  resetCanvasWithNewCircles()
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
