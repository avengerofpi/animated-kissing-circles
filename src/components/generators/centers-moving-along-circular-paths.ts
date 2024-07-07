import { ref, watch } from 'vue'
import type { Ref } from 'vue'

import { Coor, dist } from '@/models/coor'
import { Circle } from '@/models/circle'
import { MovingCoorOnACircle } from '@/models/moving-coor-on-a-circle'
import { CircleWithRadiusLine } from '@/models/circle-with-radius-line'

const title = "Centers Moving Along Circular Paths"

const numCirclesRef: Ref<number> = ref(180)
const animationCyclesPerMinuteRef: Ref<number> = ref(6)
const numArms = 6

const movingCoorsOnCircles: Ref<MovingCoorOnACircle[]> = ref([])
const routeCircles: Ref<Circle[]> = ref([])
const animating: Ref<boolean> = ref(false)
const stopAnimationFlag: Ref<boolean> = ref(false)
let startTimestamp: number
let pauseTimestamp: number
const addShapes: Ref<Function> = ref(_addShapes)
const stepAtLeastOnce: Ref<boolean> = ref(true)

let initialized = false
let height: number
let width: number
let canvasCenter: Coor

// Circle style props
let colorHueOffset: number = 0
const colorHueOffsetStepsize: number = 0.3

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

watch(animationCyclesPerMinuteRef, (newSpeed: number, oldSpeed: number) => {
  const numCyclesSinceStart = (pauseTimestamp - startTimestamp) * oldSpeed / 60000
  const newStartTimestamp = pauseTimestamp - (numCyclesSinceStart * 60000) / newSpeed

  startTimestamp = newStartTimestamp
  stepAtLeastOnce.value = true
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
  const xStep: number = width / (10 * numArms)
  const yStep: number = height / (10 * numArms)
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

  console.log(`generateRouteCircles`)
  console.dir(circles)

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

function computeRadii(centers: Coor[]): CircleWithRadiusLine[] {
  // is there a better way to copy this array?
  const unprocessedCenters: Coor[] = new Array(...centers).reverse()
  const circlesWithRadiusLine: CircleWithRadiusLine[] = []

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
    // ctx.strokeText(`(${center.x.toFixed(1)}, ${center.y.toFixed(1)}), ${radius.toFixed(1)}`, center.x-5, center.y)

    // // Add line segment pointing to nearest neighbor
    // const radiusLine = circlesWithRadiusLine.radiusLine as LineSegment
    // ctx.moveTo(radiusLine.src.x, radiusLine.src.y);
    // ctx.lineTo(radiusLine.dst.x, radiusLine.dst.y)
    // ctx.stroke();

    // Draw center dot
    const dotRadius = 5
    ctx.beginPath();
    ctx.arc(center.x, center.y, dotRadius, 0,2*Math.PI);
    ctx.fillStyle = `hsl(${(index / numCirclesRef.value) * 360 + colorHueOffset} 100% 50% / 40%)`
    ctx.fill()
    ctx.fillStyle = "hsl(0 0% 0% / 0%)"

    ctx.stroke();
  })

  // Don't progress hue if we are not actively animating (e.g., when repaiting
  // due to a mouse event or param change)
  if (animating.value) {
    colorHueOffset += colorHueOffsetStepsize
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
    const dotRadius = 3
    ctx.beginPath();
    ctx.arc(center.x, center.y, dotRadius, 0,2*Math.PI);
    ctx.fillStyle = `hsl(${(index / numCirclesRef.value) * 360 + colorHueOffset} 100% 50% / 100%)`
    ctx.fill()
    ctx.fillStyle = "hsl(0 0% 0% / 0%)"
  })

  colorHueOffset += colorHueOffsetStepsize
}

function addDebugShapes(ctx: CanvasRenderingContext2D) {
  renderRouteCircles(ctx)
}

function animate() {
  animating.value = true
  stopAnimationFlag.value = false
  // Identical to `timeStamp` used in `window.requestAnimationFrame`
  const ellapsedOffset = pauseTimestamp - startTimestamp
  startTimestamp = (document.timeline.currentTime as number) - ellapsedOffset;
}

function _addShapes(ctx: CanvasRenderingContext2D, timestamp: number) {
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
  const numCycles = elapsed * animationCyclesPerMinuteRef.value / 60000

  const kissingCircleCenters: Coor[] = []
  for (let i=0; i<numCirclesRef.value; i++) {
    const movingCoorOnCircle = movingCoorsOnCircles.value[i]
    const routeCircle = movingCoorOnCircle.routeCircle
    const radius = routeCircle.radius as number
    const thetaOffset = (2 * Math.PI) * (movingCoorOnCircle.direction * movingCoorOnCircle.speed) * numCycles
    const theta = movingCoorOnCircle.initialTheta + thetaOffset
    const x = routeCircle.center.x + (radius * Math.cos(theta))
    const y = routeCircle.center.y + (radius * Math.sin(theta))

    const kissingCircleCenter: Coor = new Coor(x, y)
    kissingCircleCenters.push(kissingCircleCenter)
  }

  renderKissingCircles(kissingCircleCenters, ctx)

  if (stopAnimationFlag.value) {
    stopAnimationFlag.value = false
    animating.value = false
  }

  return
}

function stopAnimationAfterCurrentStep() {
  stopAnimationFlag.value = true
}


export {
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
}