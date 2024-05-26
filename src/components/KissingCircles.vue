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
  <BaseCanvas
    :msg="msg + ' - KissingCircles HomeView'"
    v-model="addShapes"
  >
  </BaseCanvas>
</template>

<script setup lang="ts">
// https://vuejs.org/guide/typescript/composition-api
defineProps<{
  msg: string
}>()

import { ref, onMounted } from 'vue'
import type { Ref } from 'vue'
import BaseCanvas from './BaseCanvas.vue';
import { Coor } from './../models/coor'

const numCirclesRef: Ref<number> = ref(80)
const animationDurationRef: Ref<number> = ref(10000) // milliseconds

const srcCentersRef: Ref<Coor[]> = ref([])
const srcCentersOnCircles: Ref<CoorOnACircle[]> = ref([])
const currCentersOnCircles: Ref<CoorOnACircle[]> = ref([])
// const dstCentersRef: Ref<Coor[]> = ref([])
// const currCentersRef: Ref<Coor[]> = ref([])
const animating: Ref<boolean> = ref(false)
const stopAnimationFlag: Ref<boolean> = ref(false)
let start: number
let previousTimeStamp: number;
const DO_NOTHING = (ctx: CanvasRenderingContext2D, timeStamp: number) => {
  console.log("do nothing - do not add any shapes")
}
const addShapes: Ref<Function> = ref(DO_NOTHING)

let height: number
let width: number
let canvasCenter: Coor
let borderSize: number
let xMin: number
let yMin: number
let xMax: number
let yMax: number

let _renderedPointerCoor: Coor

// Circle style props
let colorHueOffset: number = 0
const colorHueOffsetStepsize: number = 0.3

class CoorOnACircle extends Coor {
  /** Coordinate of the point on the circle */
  coor: Coor
  /** Center of the circle the coor is on */
  center: Coor
  /** radius of the circle the Coor is on */
  radius: number
  /** Radian position of Coor on the circle */
  theta: number
  /** +1 for clockwise (default), -1 for counter-clockwise, zero for no movement */
  direction: number
  /** Speed of animation movement for this point, must be non-negative.
   * Default is `1.0` for normal speed */
  speed: number

  public constructor(coorOnCircle: Coor, radius: number, theta: number, direction: number = 1, speed: number = 1.0) {
    const centerOfCircle = new Coor(
      coorOnCircle.x - (radius * Math.cos(theta)),
      coorOnCircle.y - (radius * Math.sin(theta))
    )
    super(centerOfCircle.x, centerOfCircle.y)
    this.coor = coorOnCircle
    this.center = centerOfCircle
    this.radius = radius
    this.theta = theta
    if (![-1, 0, 1].includes(direction)) {
      throw Error(`Direction must be -1, 0, or 1, but was ${direction}`)
    }
    this.direction = direction
    if (speed < 0) {
      throw Error(`Speed must be non-negative, but was ${speed}`)
    }
    this.speed = speed
  }

  public copy() {
    return new CoorOnACircle(
      this.coor,
      this.radius,
      this.theta,
      this.direction,
      this.speed,
    )
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
  addShapes.value = _addShapes
})

function initCanvas() {
  resetCanvasWithNewCircles()
}

function resetCanvasWithNewCircles() {

  // for creating concentric circles
  canvasCenter = new Coor(width / 2, height / 2)

  borderSize = Math.max(height, width) / 10
  srcCentersRef.value = generateRandomCenters()
  srcCentersOnCircles.value = generateCoorOnCircles(srcCentersRef.value)

}

function generateRandomCenters(): Coor[] {

  const centers: Coor[] = [
    new Coor(50, 50),
    new Coor(100, 100),
  ]

  return centers;
}

function generateCoorOnCircles(centers: Coor[]): CoorOnACircle[] {
  return centers.map((center, index) => {

    const diffX = center.x - canvasCenter.x
    const diffY = center.y - canvasCenter.y
    const radius = dist(center, canvasCenter)
    const theta = Math.atan(diffY / diffX)
    const direction = 1
    const speed = 1.0

    return new CoorOnACircle(center, radius, theta, direction, speed)
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

function renderKissingCircles(centers: Coor[], ctx: CanvasRenderingContext2D) {
  const circlesWithRadiusLines = computeRadii(centers)

  circlesWithRadiusLines.forEach((circlesWithRadiusLine, index) => {
    const center = circlesWithRadiusLine.center
    const radius = circlesWithRadiusLine.radius
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0,2*Math.PI);
    ctx.fillStyle = `hsl(${(index / numCirclesRef.value) * 360 + colorHueOffset} 100% 50% / 40%)`
    ctx.fill()
    ctx.fillStyle = "hsl(0 0% 0% / 0%)"

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

function _addShapes(ctx: CanvasRenderingContext2D, timeStamp: number) {
  height = ctx.canvas.height;
  width = ctx.canvas.width;

  xMin = borderSize
  yMin = borderSize
  xMax = width - borderSize
  yMax = height - borderSize

  const newCenters: Coor[] = [
    new Coor(50, 50),
    new Coor(100, 100),
  ]
  renderKissingCircles(newCenters, ctx)
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
