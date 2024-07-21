import { ref, watch } from 'vue'
import type { Ref } from 'vue'

import { Coor, dist } from '@/models/coor'
import { Circle } from '@/models/circle'
import { Ellipse } from '@/models/ellipse'
import { MovingCoorOnACircle } from '@/models/moving-coor-on-a-circle'
import { CircleWithRadiusLine } from '@/models/circle-with-radius-line'

const title = "Centers Moving Along Circular Paths"

const numCirclesRef: Ref<number> = ref(4)
const animationCyclesPerMinuteRef: Ref<number> = ref(3)
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
let ellipseRotationOffset: number = 0

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

function computeEllipses(centers: Coor[], ctx: CanvasRenderingContext2D): Ellipse[] {
  // is there a better way to copy this array?
  const unprocessedCenters: Coor[] = new Array(...centers).reverse()
  const ellipses: Ellipse[] = []

  // TODO: deal with `centers` having 0 or 1 entries
  while (unprocessedCenters.length) {
    const center = unprocessedCenters.pop() as Coor
    let distToNearestNeighbor: number = Number.MAX_VALUE
    // let nearestNeighborCenter: Coor = center
    let radiusX: number = 0
    let radiusY: number = 0
    let rotation: number = 0
    // First ellipse will be 1/3 distance between first point and nearest point.
    if (ellipses.length === 0) {
      let nearestNeighborCenter: Coor = center
      unprocessedCenters.forEach((B) => {
        const distToB = dist(center, B)
        if (distToB < distToNearestNeighbor) {
          nearestNeighborCenter = B
          distToNearestNeighbor = distToB
        }
      })
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
        rotation = Math.atan(diffY/diffX)
      }
      radiusX = distToNearestNeighbor * (2/3)
      radiusY = (1/3) * radiusX
    }
    // Remaining ellipses will generate based on nearest existing ellipse
    else {
      let nearestNeighborEllipse: Ellipse = ellipses[0]
      ellipses.forEach((otherEllipse) => {
        const [distToOtherEllipse, pointOnOtherEllipse] = otherEllipse.distToPoint(center)
        if (distToOtherEllipse < distToNearestNeighbor) {
          distToNearestNeighbor = distToOtherEllipse
          nearestNeighborEllipse = otherEllipse
        }
      })
      const diffX = nearestNeighborEllipse.center.x - center.x
      const diffY = nearestNeighborEllipse.center.y - center.y
      if (diffY === 0) {
        if (diffX === 0) {
          console.warn(`The current point ${JSON.stringify(center)} is the same as another point`)
        } else if (diffX > 0) {
          rotation = 0.5 * Math.PI
        } else {
          rotation = 1.5 * Math.PI
        } 
      } else {
        rotation = Math.atan(diffY/diffX)
      }
      radiusX = distToNearestNeighbor
      radiusY = (2/3) * radiusX
    }
    const ellipse: Ellipse = new Ellipse(center.x, center.y, radiusX, radiusY, rotation)
    ellipses.push(ellipse)
  }

  return ellipses
}

function renderKissingCircles(centers: Coor[], ctx: CanvasRenderingContext2D) {
  // console.log(`running renderKissingCircles`)
  const ellipses = computeEllipses(centers, ctx)
  ellipses.forEach((ellipse, index) => {
    const center = ellipse.center
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, ellipse.radiusX, ellipse.radiusY, ellipse.rotation, 0, 2*Math.PI);
    ctx.fillStyle = `hsl(${(index / numCirclesRef.value) * 360 + colorHueOffset} 100% 50% / 40%)`
    ctx.fill()
    ctx.fillStyle = "hsl(0 0% 0% / 0%)"
    ctx.strokeText(index.toString(), center.x+10, center.y+10)

    // // Add line segment pointing to nearest neighbor
    // const origLineWidth = ctx.lineWidth
    // ctx.lineWidth = origLineWidth * 0.5
    // ctx.beginPath();
    // ctx.setLineDash([1,1]);
    // ctx.moveTo(ellipse.center.x, ellipse.center.y);
    // const scaledVertex = ellipse.center.add(ellipse.vertices[0].scale(-1))
    // ctx.lineTo(ellipse.vertices[0].x, ellipse.vertices[0].y)
    // ctx.moveTo(ellipse.center.x, ellipse.center.y);
    // ctx.lineTo(ellipse.coVertices[0].x, ellipse.coVertices[0].y)
    // ctx.stroke();
    // ctx.setLineDash([]);

    // // Draw a dot at angle `ellipseRotationOffset` from major axis
    // const pointOnEllipse = ellipse.getPointAtAngle(ellipseRotationOffset)
    // const dotRadius = 1
    // ctx.beginPath();
    // ctx.arc(pointOnEllipse.x, pointOnEllipse.y, dotRadius, 0,2*Math.PI);
    // ctx.fillStyle = `hsl(${(index / numCirclesRef.value) * 360 + colorHueOffset} 100% 50% / 40%)`
    // ctx.fill()
    // ctx.stroke()
    // ctx.fillStyle = "hsl(0 0% 0% / 0%)"
    // ctx.lineWidth = origLineWidth

    // Draw center dot
    const dotRadius = 2
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
  const numCycles = elapsed * animationCyclesPerMinuteRef.value / 60000

  const kissingCircleCenters: Coor[] = movingCoorsOnCircles.value.map(movingCoorOnCircle => {
    return movingCoorOnCircle.getCoorAfterCycles(numCycles)
  })
  renderKissingCircles(kissingCircleCenters, ctx)

  // const kissingCircleCenters: Coor[] = movingCoorsOnCircles.value.map(movingCoorOnCircle => {
  //   return movingCoorOnCircle.initialCoor
  // })

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
