<template>
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
</template>

<script setup lang="ts">
// https://vuejs.org/guide/typescript/composition-api
// defineProps<{}>()

import { ref, watch } from 'vue'
import type { Ref } from 'vue'

import { Coor, dist, distSquared } from '@/models/coor'
import { Circle } from '@/models/circle'
import { Ellipse } from '@/models/ellipse'
import { MovingCoorOnACircle } from '@/models/moving-coor-on-a-circle'
import { renderShapeFrame } from '@/components/generators/generate-nearest-point-data'
import { animating, stepAtLeastOnce, stopAnimationFlag } from '@/components/generators/animation-controller.vue'
import { ConstellationGenerator } from '@/models/generator'

const title = "Ellipses with Centers Moving Along Circular Paths"
const shortTitle = "Ellipses Along Circles"
const display = true

// const numCirclesRef: Ref<number> = ref(100)
// const animationCyclesPerMinuteRef: Ref<number> = ref(3)
const numArms = 6

const movingCoorsOnCircles: Ref<MovingCoorOnACircle[]> = ref([])
const routeCircles: Ref<Circle[]> = ref([])
let startTimestamp: number
let pauseTimestamp: number
// const addShapes: Ref<Function> = ref(_addShapes)

let initialized = false
let height: number
let width: number
let canvasCenter: Coor

// Circle style props
let colorHueOffset: number = 0
const colorHueOffsetStepsize: number = 0.3
let ellipseRotationOffset: number = 0
const toggleAnimating: Ref<Function> = ref(_toggleAnimating)
const numCirclesRef: Ref<number> = ref(100)

onMounted(() => {
})

function incrementNumCircles() {
  numCirclesRef.value++
}

function decrementNumCircles() {
  numCirclesRef.value--
  numCirclesRef.value = Math.max(0, numCirclesRef.value)
}

watch(numCirclesRef, (newNumCircles: number, oldNumCircles: number) => {
  stepAtLeastOnce.value = true
  console.info(`update numCircles: ${oldNumCircles} (${typeof oldNumCircles}) -> ${newNumCircles} (${typeof newNumCircles})`)
  const numAdditionalCircles: number = newNumCircles - oldNumCircles
  console.log(`numAdditionalCircles: ${numAdditionalCircles}`)
  if (numAdditionalCircles < 0) {
    console.log(`${-numAdditionalCircles} removed routeCircles`)
    if (initialized) {
      routeCircles.value = routeCircles.value.slice(0, newNumCircles)
      movingCoorsOnCircles.value = generateMovingCoorsOnCircles(routeCircles.value)
    }
  } else {
    if (initialized) {
      const additionalRouteCircles: Circle[] = generateRouteCircles(numAdditionalCircles, routeCircles.value)
      routeCircles.value = routeCircles.value.concat(additionalRouteCircles)
      movingCoorsOnCircles.value = generateMovingCoorsOnCircles(routeCircles.value)
    }
    console.log(`${numAdditionalCircles} additional routeCircles`)
  }
})

function regenerateCircles() {
  resetCanvasWithNewCircles()
}

function initCanvas(ctx: CanvasRenderingContext2D, timestamp: number) {
  height = ctx.canvas.height;
  width = ctx.canvas.width;
  initialized = true;

  canvasCenter = new Coor(0, 0)

  resetCanvasWithNewCircles()
}

function resetCanvasWithNewCircles() {
  routeCircles.value = generateRouteCircles(numCirclesRef.value)
  movingCoorsOnCircles.value = generateMovingCoorsOnCircles(routeCircles.value)

  startTimestamp = (document.timeline.currentTime as number)
  pauseTimestamp = startTimestamp
  stepAtLeastOnce.value = true
}

function generateRouteCircles(n: number, existingRouteCircles: Circle[] = []): Circle[] {
  const m = existingRouteCircles.length
  const xStep: number = width / (2 * numArms)
  const yStep: number = height / (2 * numArms)
  const thetaStep = (2 * Math.PI) / numArms

  const circles: Circle[] = []
  for (let i=0; i<n; i++) {
    const j=m+i+1
    const theta = j * (thetaStep + 1)
    const xBeforeRotation = canvasCenter.x + (j * xStep)
    const yBeforeRotation = canvasCenter.y + (j * yStep)
    const xAfterRotation = (Math.cos(theta) * xBeforeRotation) - (Math.sin(theta) * yBeforeRotation)
    const yAfterRotation = (Math.sin(theta) * xBeforeRotation) + (Math.cos(theta) * yBeforeRotation)
    const x = canvasCenter.x + xAfterRotation
    const y = canvasCenter.y + yAfterRotation
    const center = new Coor(x, y)
    const radius = dist(center, canvasCenter) / 1.5

    circles.push(new Circle(x, y, radius))
  }

  // console.log(`generateRouteCircles`)
  // console.dir(circles)

  return circles
}

function generateMovingCoorsOnCircles(routeCircles: Circle[]): MovingCoorOnACircle[] {
  const thetaStep = (2 * Math.PI) / numArms
  // const thetaStep = 0
  const movingCoorsOnCircles = routeCircles.map((routeCircle, index) => {
    const movingCoorOnACircles = new MovingCoorOnACircle(
      routeCircle,
      thetaStep * index,
      1,
      1 + (0.005 * (index % numArms))
    )
    return movingCoorOnACircles
  })

  console.log(`generateMovingCoorsOnCircles`)
  console.dir(movingCoorsOnCircles)

  return movingCoorsOnCircles
}

function computeEllipses(centers: Coor[]): Ellipse[] {
  // is there a better way to copy this array?
  const unprocessedCenters: Coor[] = new Array(...centers).reverse()
  const ellipses: Ellipse[] = []

  // TODO: deal with `centers` having 0 or 1 entries
  while (unprocessedCenters.length) {
    const center = unprocessedCenters.pop() as Coor
    let radiusX: number = 0
    let radiusY: number = 0
    let rotation: number = 0

    if (ellipses.length === 0) {
      // First ellipse will be 1/3 distance between first point and nearest point.
      // console.debug(`Processing ellipse #0`)
      const distSquaredAndOtherCenters: Array<[number, Coor]> = unprocessedCenters.map(
        otherCenter => [distSquared(center, otherCenter), otherCenter]
      )
      // console.debug(`distSquaredAndOtherCenters: ${JSON.stringify(distSquaredAndOtherCenters.map(([d, p]) => d.toFixed(1)))}`)
      distSquaredAndOtherCenters.sort(([d1, p1], [d2, p2]) => d1 - d2)
      // console.debug(`distSquaredAndOtherCenters: ${JSON.stringify(distSquaredAndOtherCenters.map(([d, p]) => d.toFixed(1)))} (sorted)`)

      const [distSquaredToNearestNeighbor, nearestNeighborCenter] = distSquaredAndOtherCenters[0]
      let radiusYscale = 1/3
      if (distSquaredAndOtherCenters.length > 1) {
        const nextNearestDistSquared = distSquaredAndOtherCenters[1][0]
        radiusYscale = (Math.sqrt(distSquaredToNearestNeighbor)+1000) / (Math.sqrt(nextNearestDistSquared) + 1000)
      }

      const diffX = nearestNeighborCenter.x - center.x
      const diffY = nearestNeighborCenter.y - center.y
      if (diffY === 0) {
        if (diffX === 0) {
          console.warn(`The current point ${JSON.stringify(center)} is the same as another point`)
        } else if (diffX > 0) {
          rotation = 0.5 * Math.PI
        } else {
          rotation = 1.5 * Math.PI
        } 
      } else {
        rotation = Math.atan2(diffY, diffX)
      }
      radiusX = Math.sqrt(distSquaredToNearestNeighbor) * (2/3)
      radiusY = radiusX * radiusYscale
    } else {
      // Remaining ellipses will generate based on nearest existing ellipse
      // console.debug(`Processing ellipse #${ellipses.length}`)
      const distSquaredAndPointsOnOtherEllipses: Array<[number, number, Coor]> = ellipses
        .map((otherEllipse) => otherEllipse.nearestPointToAnotherPointApproximatation(center).reverse() as [number, number, Coor])
      // console.debug(`distSquaredAndPointsOnOtherEllipses: ${JSON.stringify(distSquaredAndPointsOnOtherEllipses.map(([d, t, p]) => d.toFixed(1)))}`)
      distSquaredAndPointsOnOtherEllipses.sort(([theta1, d1, p1], [theta2, d2, p2]) => d1 - d2)
      // console.debug(`distSquaredAndPointsOnOtherEllipses: ${JSON.stringify(distSquaredAndPointsOnOtherEllipses.map(([d, t, p]) => d.toFixed(1)))} (sorted)`)

      const [_t1, distSquaredToNearestNeighbor, nearestPointOnNeighbor] = distSquaredAndPointsOnOtherEllipses[0]
      let radiusYscale = 1/3
      if (ellipses.length > 1) {
        const [_t2, nextNearestDistSquared, _d2] = distSquaredAndPointsOnOtherEllipses[1]
        radiusYscale = (Math.sqrt(distSquaredToNearestNeighbor)+1000) / (Math.sqrt(nextNearestDistSquared) + 1000)
      }

      const diffX = nearestPointOnNeighbor.x - center.x
      const diffY = nearestPointOnNeighbor.y - center.y
      if (distSquaredToNearestNeighbor == 0) {
        console.warn(`The current point ${JSON.stringify(center)} is the same as another point`)
      } else {
        rotation = Math.atan2(diffY, diffX)
      }
      radiusX = Math.sqrt(distSquaredToNearestNeighbor)
      radiusY = radiusX * radiusYscale
      // console.debug(`radiusY / radiusX = ${radiusYscale.toFixed(3)}`)
    }
    // console.debug(`-----------------------------`)

    const ellipse: Ellipse = new Ellipse(center.x, center.y, radiusX, radiusY, rotation)
    ellipses.push(ellipse)

    // // Draw demo/debug stuff
    // if (nearestPointOnNeighbor) {
    //   const segment = new LineSegment(center, nearestPointOnNeighbor)
    //   segment.draw(ctx)
    // }
  }
  console.debug(`----------------------------------------------------------`)
  console.info(`----------------------------------------------------------`)

  return ellipses
}

function renderKissingEllipses(centers: Coor[], ctx: CanvasRenderingContext2D) {
  // console.log(`running renderKissingCircles`)
  const ellipses = computeEllipses(centers)
  const origLineWidth = ctx.lineWidth
  ctx.lineWidth = origLineWidth * 0.75

  ellipses.forEach((ellipse, index) => {
    // const center = ellipse.center

    // Ellipse
    ctx.beginPath();
    ctx.ellipse(ellipse.center.x, ellipse.center.y, ellipse.radiusX, ellipse.radiusY, ellipse.rotation, 0, 2*Math.PI);
    ctx.fillStyle = `hsl(${(index / numCirclesRef.value) * 360 + colorHueOffset} 100% 50% / 40%)`
    ctx.fill()
    // ctx.fillStyle = "hsl(0 0% 0% / 0%)"
    ctx.strokeText(index.toString(), ellipse.center.x+10, ellipse.center.y+10)
    // // add circle with same center and radius = ellipse.radiusMajor
    // ctx.beginPath();
    // ctx.arc(ellipse.center.x, ellipse.center.y, ellipse.radiusMajor, 0, 2*Math.PI)
    // ctx.stroke()

    // Draw major and minor axes
    // major axis
    // ctx.beginPath();
    // ctx.setLineDash([15,15]);
    // ctx.moveTo(ellipse.vertices[0].x, ellipse.vertices[0].y);
    // ctx.lineTo(ellipse.center.x, ellipse.center.y);
    // ctx.stroke();
    ctx.beginPath();
    ctx.setLineDash([3,2]);
    ctx.moveTo(ellipse.center.x, ellipse.center.y);
    ctx.lineTo(ellipse.vertices[1].x, ellipse.vertices[1].y)
    ctx.stroke();
    // minor axis
    // ctx.beginPath();
    // ctx.setLineDash([15,15]);
    // ctx.moveTo(ellipse.coVertices[0].x, ellipse.coVertices[0].y);
    // ctx.lineTo(ellipse.center.x, ellipse.center.y);
    // ctx.stroke();
    ctx.beginPath();
    ctx.setLineDash([3,2]);
    ctx.moveTo(ellipse.center.x, ellipse.center.y);
    ctx.lineTo(ellipse.coVertices[1].x, ellipse.coVertices[1].y)
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw a dot at "positve" vertex
    ellipse.vertices[1].draw(ctx, 5)

    // Draw center dot
    ellipse.center.draw(ctx, 3)
  })

  // cleanup
  ctx.fillStyle = "hsl(0 0% 0% / 0%)"
  ctx.lineWidth = origLineWidth
  
  // Don't progress hue if we are not actively animating (e.g., when repaiting
  // due to a mouse event or param change)
  if (animating.value) {
    colorHueOffset += colorHueOffsetStepsize
    ellipseRotationOffset += Math.PI / 60
  }
}

function renderRouteCircles(ctx: CanvasRenderingContext2D) {
  routeCircles.value.forEach((routeCircle, index) => {
    const center = routeCircle.center
    const radius = routeCircle.radius as number

    ctx.beginPath();
    ctx.setLineDash([7,3]);
    ctx.arc(center.x, center.y, radius, 0,2*Math.PI);

    ctx.stroke();
    ctx.setLineDash([]);

    // Draw center dot
    const dotRadius = 2
    ctx.beginPath();
    ctx.arc(center.x, center.y, dotRadius, 0,2*Math.PI);
    ctx.fillStyle = `hsl(1 100% 0% / 100%)`
    ctx.fill()
    ctx.fillStyle = "hsl(0 0% 0% / 0%)"
  })

  colorHueOffset += colorHueOffsetStepsize
}

function addDebugShapes(ctx: CanvasRenderingContext2D) {
  renderRouteCircles(ctx)
}

let frameNum = 0
function addShapes(ctx: CanvasRenderingContext2D, timestamp: number) {
  // console.log(`running _addShapes`)
  initialized || initCanvas(ctx, timestamp)

  let elapsed: number
  if (animating.value) {
    pauseTimestamp = timestamp
    elapsed = timestamp - startTimestamp
    frameNum++
  } else if (stepAtLeastOnce.value) {
    elapsed = pauseTimestamp - startTimestamp
  } else {
    throw new Error(`_addShapes should not have been called`)
  }

  // Loop animation, instead of stop animation after an animation cycle
  // const millisecondsPerMinute: number = 60000
  // const numCycles = elapsed * animationCyclesPerMinuteRef.value / millisecondsPerMinute

  // const kissingEllipseCenters: Coor[] = movingCoorsOnCircles.value.map(movingCoorOnCircle => {
  //   return movingCoorOnCircle.getCoorAfterCycles(numCycles)
  // })
  // renderKissingEllipses(kissingEllipseCenters, ctx)
  renderShapeFrame(frameNum, ctx)
  // console.log(frameNum)

  if (stopAnimationFlag.value) {
    stopAnimationFlag.value = false
    animating.value = false
  }

  return
}

const generator = new ConstellationGenerator(
  title,
  display,
  // animate,
  animationCyclesPerMinuteRef,
  regenerateCircles,
  addShapes,
  addDebugShapes,
)

export {
  generator
  // title,
  // numCirclesRef,
  // regenerateCircles,
  // animationCyclesPerMinuteRef,
  // animate,
  // addShapes,
  // addDebugShapes,
}

</script>