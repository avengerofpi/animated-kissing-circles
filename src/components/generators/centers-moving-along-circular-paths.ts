import { ref, watch } from 'vue'
import type { Ref } from 'vue'

import { Coor, dist, distSquared } from '@/models/coor'
import { Circle } from '@/models/circle'
import { Ellipse } from '@/models/ellipse'
import { MovingCoorOnACircle } from '@/models/moving-coor-on-a-circle'
import { renderShapeFrame } from '@/components/generators/generate-nearest-point-data'

const title = "Ellipses with Centers Moving Along Circular Paths"

const numCirclesRef: Ref<number> = ref(100)
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

  const el = new Ellipse(0, 0, 2, 1, 0)

  console.log(el)
  let d
  d = Number(el.nearestPointToAnotherPointApproximatation(new Coor(3, 0))[1].toFixed(4));
  console.log(`(3, 0): Python 1.0 | JavaScript: ${d} | Diff: ${(Math.abs(1.0 - d)).toFixed(4)}`)
  d = Number(el.nearestPointToAnotherPointApproximatation(new Coor(0, 2))[1].toFixed(4));
  console.log(`(0, 2): Python 1.0 | JavaScript: ${d} | Diff: ${(Math.abs(1.0 - d)).toFixed(4)}`)
  d = Number(el.nearestPointToAnotherPointApproximatation(new Coor(2.0, 2))[1].toFixed(4));
  console.log(`(2.0, 2): Python 2.014 | JavaScript: ${d} | Diff: ${(Math.abs(2.014 - d)).toFixed(4)}`)
  d = Number(el.nearestPointToAnotherPointApproximatation(new Coor(1.8, 2))[1].toFixed(4));
  console.log(`(1.8, 2): Python 1.788 | JavaScript: ${d} | Diff: ${(Math.abs(1.788 - d)).toFixed(4)}`)
  d = Number(el.nearestPointToAnotherPointApproximatation(new Coor(1.6, 2))[1].toFixed(4));
  console.log(`(1.6, 2): Python 1.599 | JavaScript: ${d} | Diff: ${(Math.abs(1.599 - d)).toFixed(4)}`)
  d = Number(el.nearestPointToAnotherPointApproximatation(new Coor(1.4, 2))[1].toFixed(4));
  console.log(`(1.4, 2): Python 1.443 | JavaScript: ${d} | Diff: ${(Math.abs(1.443 - d)).toFixed(4)}`)
  d = Number(el.nearestPointToAnotherPointApproximatation(new Coor(1.2, 2))[1].toFixed(4));
  console.log(`(1.2, 2): Python 1.315 | JavaScript: ${d} | Diff: ${(Math.abs(1.315 - d)).toFixed(4)}`)
  d = Number(el.nearestPointToAnotherPointApproximatation(new Coor(1.0, 2))[1].toFixed(4));
  console.log(`(1.0, 2): Python 1.213 | JavaScript: ${d} | Diff: ${(Math.abs(1.213 - d)).toFixed(4)}`)
  d = Number(el.nearestPointToAnotherPointApproximatation(new Coor(0.8, 2))[1].toFixed(4));
  console.log(`(0.8, 2): Python 1.133 | JavaScript: ${d} | Diff: ${(Math.abs(1.133 - d)).toFixed(4)}`)
  d = Number(el.nearestPointToAnotherPointApproximatation(new Coor(0.6, 2))[1].toFixed(4));
  console.log(`(0.6, 2): Python 1.074 | JavaScript: ${d} | Diff: ${(Math.abs(1.074 - d)).toFixed(4)}`)
  d = Number(el.nearestPointToAnotherPointApproximatation(new Coor(0.4, 2))[1].toFixed(4));
  console.log(`(0.4, 2): Python 1.032 | JavaScript: ${d} | Diff: ${(Math.abs(1.032 - d)).toFixed(4)}`)
  d = Number(el.nearestPointToAnotherPointApproximatation(new Coor(0.2, 2))[1].toFixed(4));
  console.log(`(0.2, 2): Python 1.008 | JavaScript: ${d} | Diff: ${(Math.abs(1.008 - d)).toFixed(4)}`)
  d = Number(el.nearestPointToAnotherPointApproximatation(new Coor(0.0, 2))[1].toFixed(4));
  console.log(`(0.0, 2): Python 1.0 | JavaScript: ${d} | Diff: ${(Math.abs(1.0 - d)).toFixed(4)}`)
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
      console.debug(`Processing ellipse #0`)
      const distSquaredAndOtherCenters: Array<[number, Coor]> = unprocessedCenters.map(
        otherCenter => [distSquared(center, otherCenter), otherCenter]
      )
      console.debug(`distSquaredAndOtherCenters: ${JSON.stringify(distSquaredAndOtherCenters.map(([d, p]) => d.toFixed(1)))}`)
      distSquaredAndOtherCenters.sort(([d1, p1], [d2, p2]) => d1 - d2)
      console.debug(`distSquaredAndOtherCenters: ${JSON.stringify(distSquaredAndOtherCenters.map(([d, p]) => d.toFixed(1)))} (sorted)`)

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
      console.debug(`Processing ellipse #${ellipses.length}`)
      const distSquaredAndPointsOnOtherEllipses: Array<[number, number, Coor]> = ellipses
        .map((otherEllipse) => otherEllipse.nearestPointToAnotherPointApproximatation(center).reverse() as [number, number, Coor])
      console.debug(`distSquaredAndPointsOnOtherEllipses: ${JSON.stringify(distSquaredAndPointsOnOtherEllipses.map(([d, t, p]) => d.toFixed(1)))}`)
      distSquaredAndPointsOnOtherEllipses.sort(([theta1, d1, p1], [theta2, d2, p2]) => d1 - d2)
      console.debug(`distSquaredAndPointsOnOtherEllipses: ${JSON.stringify(distSquaredAndPointsOnOtherEllipses.map(([d, t, p]) => d.toFixed(1)))} (sorted)`)

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
      console.debug(`radiusY / radiusX = ${radiusYscale.toFixed(3)}`)
    }
    console.debug(`-----------------------------`)

    const ellipse: Ellipse = new Ellipse(center.x, center.y, radiusX, radiusY, rotation)
    ellipses.push(ellipse)

    // // Draw demo/debug stuff
    // if (nearestPointOnNeighbor) {
    //   const segment = new LineSegment(center, nearestPointOnNeighbor)
    //   segment.draw(ctx)
    // }
  }
  console.debug(`----------------------------------------------------------`)

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

function animate() {
  animating.value = true
  stopAnimationFlag.value = false
  // Identical to `timeStamp` used in `window.requestAnimationFrame`
  const ellapsedOffset = pauseTimestamp - startTimestamp
  startTimestamp = (document.timeline.currentTime as number) - ellapsedOffset;
}

let frameNum = 0
function _addShapes(ctx: CanvasRenderingContext2D, timestamp: number) {
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

  // // Loop animation, instead of stop animation after an animation cycle
  // const numCycles = elapsed * animationCyclesPerMinuteRef.value / 60000
  //
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
