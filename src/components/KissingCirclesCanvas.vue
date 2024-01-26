<template>
  <!-- Silly header -->
  <h1 class="green">{{ msg }}, now bugger off</h1>
  <!-- Buttons -->
  <div>
    <button type="button" @click="regenerateCircles" :disabled=animating>Regenerate Circles</button>
    <button type="button" @click="animate" :disabled=animating>Animate Circles</button>
    <button type="button" @click="stopAnimationAfterCurrentStep" :disabled="!animating || stopAnimationFlag">
      <span v-if="!stopAnimationFlag">Stop Animation</span>
      <span v-if="stopAnimationFlag">Pending Stop...</span>
    </button>
  </div>
  <!-- Basic input -->
  <div>
    <label for="nInput">Number of Circles:</label>
    <input id="nInput" v-model.lazy="numCirclesRef">

    <label for="animationTimeInput">Duration of each transition</label>
    <input id="animationTimeInput" v-model.lazy="animationDurationRef">
  </div>
  <!-- Canvas -->
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

const numCirclesRef: Ref<number> = ref(10)
const animationDurationRef: Ref<number> = ref(10000) // milliseconds

let ctx: CanvasRenderingContext2D
const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)
const srcCentersRef: Ref<Coor[]> = ref([])
const srcCentersOnCircles: Ref<CoorOnACircle[]> = ref([])
const dstCentersRef: Ref<Coor[]> = ref([])
const currCentersRef: Ref<Coor[]> = ref([])
const animating: Ref<boolean> = ref(false)
const stopAnimationFlag: Ref<boolean> = ref(false)
let start: number
let previousTimeStamp: number;

let height: number
let width: number
let borderSize: number
let xMin: number
let yMin: number
let xMax: number
let yMax: number
let scale: number = 1
let zoomLevel: number = 0
const scaleStepSize = 2 ** (1/4)
let colorHueOffset: number = 0
const colorHueOffsetStepsize: number = 0.3

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

class CoorOnACircle extends Coor {
  /* radius of the circle the Coor is on */
  radius: number
  /* Radian position of Coor on the circle */
  theta: number

  public constructor(coorOnCircle: Coor, radius: number, theta: number) {
    const centerOfCircle = new Coor(
      coorOnCircle.x - (radius * Math.cos(theta)),
      coorOnCircle.y - (radius * Math.sin(theta))
    )
    super(centerOfCircle.x, centerOfCircle.y)
    this.radius = radius
    this.theta = theta
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
    ctx = canvasRef.value.getContext("2d") as CanvasRenderingContext2D
    // Scale canvas on mouse wheel scrolling
    canvasRef.value.addEventListener("wheel", (event: WheelEvent) => {
      if (event.deltaY) {
        zoomLevel += (event.deltaY > 0) ? -1 : 1
        scale = scaleStepSize ** zoomLevel
      }
      ctx.scale(scale, scale)
    })
    initCanvas()
  } else {
    console.error('ERROR! Canvas element not available after mount.')
  }

})

function initCanvas() {
  resetCanvasWithNewCircles()
}

function resetCanvasWithNewCircles() {
  height = ctx.canvas.height;
  width = ctx.canvas.width;

  borderSize = Math.max(height, width) / 10
  xMin = borderSize
  yMin = borderSize
  xMax = width - borderSize
  yMax = height - borderSize
  srcCentersRef.value = generateRandomCenters()
  srcCentersOnCircles.value = generateCoorOnCircles(srcCentersRef.value)

  renderKissingCircles(srcCentersRef.value);
}

function generateRandomCenters(): Coor[] {

  const centers: Coor[] = []
  if (numCirclesRef.value <= 0) return centers;

  for (let i=0; i<numCirclesRef.value; i++) {
    let x: number = xMin + (xMax - xMin)*Math.random()
    let y: number = yMin + (yMax - yMin)*Math.random()
    centers.push(new Coor(x, y))
  }
  return centers;
}

function generateCoorOnCircles(centers: Coor[]): CoorOnACircle[] {
  return centers.map(center => {
    const radius = 10 + (190 * Math.random())
    const theta = (2 * Math.PI) * Math.random()
    return new CoorOnACircle(center, radius, theta)
  })
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

  ctx.reset()
  ctx.scale(scale, scale)
  ctx.fillStyle = "hsl(100 0% 0% / 20%)"
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = "white"
  ctx.fillRect(xMin, yMin, xMax-xMin, yMax-yMin)
  
  circlesWithRadiusLines.forEach((circlesWithRadiusLine, index) => {
    const center = circlesWithRadiusLine.center
    const radius = circlesWithRadiusLine.radius
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0,2*Math.PI);
    ctx.fillStyle = `hsl(${(index / numCirclesRef.value) * 360 + colorHueOffset} 100% 50% / 40%)`
    ctx.fill()
    ctx.fillStyle = "hsl(0 0% 0% / 0%)"
    // ctx.strokeText(`(${center.x.toFixed(1)}, ${center.y.toFixed(1)}), ${radius.toFixed(1)}`, center.x-5, center.y)

    // Add line segment pointing to nearest neighbor
    // const radiusLine = circlesWithRadiusLine.radiusLine as LineSegment
    // ctx.moveTo(radiusLine.src.x, radiusLine.src.y);
    // ctx.lineTo(radiusLine.dst.x, radiusLine.dst.y)

    ctx.stroke();
  })
  colorHueOffset += colorHueOffsetStepsize
}

function dist(a: Coor, b: Coor): number {
  return Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2)
}

function regenerateCircles() {
  resetCanvasWithNewCircles()
}

function animate() {
  dstCentersRef.value = generateRandomCenters()
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

  if (elapsed > 0 && timeStamp !== previousTimeStamp) {
    /* In case `timestamp` is greater than `animationDurationRef.value`, cap the amount of movement at 100% */
    const stepSize = Math.min(1, elapsed / animationDurationRef.value)

    let newCenters: Coor[] = []
    for (let i=0; i<numCirclesRef.value; i++) {
      // const x = srcCentersRef.value[i].x + (dstCentersRef.value[i].x - srcCentersRef.value[i].x) * stepSize
      // const y = srcCentersRef.value[i].y + (dstCentersRef.value[i].y - srcCentersRef.value[i].y) * stepSize

      const srcCentersOnCircle = srcCentersOnCircles.value[i]
      const centerOfCircle = new Coor(srcCentersOnCircle.x, srcCentersOnCircle.y)
      const radius = srcCentersOnCircle.radius
      const theta = srcCentersOnCircle.theta + (2 * Math.PI * stepSize)

      const MAX_PETURB = 1
      const xPeturb = MAX_PETURB * Math.random()
      const yPeturb = MAX_PETURB * Math.random()

      const x = centerOfCircle.x + (radius * Math.cos(theta)) + xPeturb
      const y = centerOfCircle.y + (radius * Math.sin(theta)) + yPeturb

      newCenters.push(new Coor(x, y))
    }
    currCentersRef.value = newCenters
    renderKissingCircles(newCenters)
  }

  if (elapsed < animationDurationRef.value) {
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
