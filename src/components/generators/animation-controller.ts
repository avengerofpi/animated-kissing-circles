import { Coor } from '@/models/coor'
import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import { ConstellationGenerator } from '@/models/generator'

const animating: Ref<boolean> = ref(false)
const stopAnimationFlag: Ref<boolean> = ref(false)
const stepAtLeastOnce: Ref<boolean> = ref(true)
const generators: ConstellationGenerator[] = []

let startTimestamp: number
let pauseTimestamp: number
const addShapes: Ref<Function> = ref(_addShapes)

let initialized = false
let height: number
let width: number
let canvasCenter: Coor

watch(animationCyclesPerMinuteRef, (newSpeed: number, oldSpeed: number) => {
  const numCyclesSinceStart = (pauseTimestamp - startTimestamp) * oldSpeed / 60000
  const newStartTimestamp = pauseTimestamp - (numCyclesSinceStart * 60000) / newSpeed

  startTimestamp = newStartTimestamp
  stepAtLeastOnce.value = true
})

function regenerateShapes() {
  for (const g of generators) {
    g.regenerateShapes()
  }
}

function initCanvas(ctx: CanvasRenderingContext2D, timestamp: number) {
  height = ctx.canvas.height;
  width = ctx.canvas.width;
  initialized = true;

  canvasCenter = new Coor(0, 0)
  regenerateShapes()
}

function resetCanvas() {
  for (const g of generators) {
    g.regenerateShapes()
  }
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
    frameNum++
  } else if (stepAtLeastOnce.value) {
    elapsed = pauseTimestamp - startTimestamp
  } else {
    throw new Error(`_addShapes should not have been called`)
  }

  // Loop animation, instead of stop animation after an animation cycle
  const millisecondsPerMinute: number = 60000
  const numCycles = elapsed * animationCyclesPerMinuteRef.value / millisecondsPerMinute
  
  const kissingEllipseCenters: Coor[] = movingCoorsOnCircles.value.map(movingCoorOnCircle => {
    return movingCoorOnCircle.getCoorAfterCycles(numCycles)
  })
  renderKissingEllipses(kissingEllipseCenters, ctx)

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
  animating,
  stopAnimationFlag,
  stopAnimationAfterCurrentStep,
  stepAtLeastOnce,
  animate,
  addShapes,
  addDebugShapes,
}
