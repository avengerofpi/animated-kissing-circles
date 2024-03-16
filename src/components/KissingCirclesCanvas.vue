<template>
  <!-- Debug Canvas Details -->
  <div v-if="debug">
    <div>Zoom Level: {{ canvasZoomLevelRef.toFixed(3) }}</div>
    <div>Canvas Scale: {{ canvasScaleRef.toFixed(3) }}</div>
    <div>Canvas Offset: ({{ canvasOffsetRef.x.toFixed(1) }}, {{ canvasOffsetRef.y.toFixed(1) }})</div>
    <div>Scaled Canvas Dimensions: ({{ canvasScaledDimensionsRef.x.toFixed(1) }}, {{ canvasScaledDimensionsRef.y.toFixed(1) }})</div>
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

let ctx: CanvasRenderingContext2D
const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)

const debug = true

let height: number
let width: number
let borderSize: number
let xMin: number
let yMin: number
let xMax: number
let yMax: number

let lastPointerDownCoor: Coor
let lastZoomChangeCoor: Coor

class Coor {
  x: number
  y: number

  public constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  public static fromXYCoorPair(xyCoorPair: number[]) {
    return new Coor(xyCoorPair[0], xyCoorPair[1])
  }
}

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext("2d") as CanvasRenderingContext2D
    canvasRef.value.addEventListener('mousedown', onPointerDown)
    canvasRef.value.addEventListener('mouseup', onPointerUp)
    canvasRef.value.addEventListener('mousemove', onPointerMove)
    canvasRef.value.addEventListener('wheel', adjustZoom)
    initAndAnimate()
  } else {
    console.error('ERROR! Canvas element not available after mount.')
  }

})

function initAndAnimate() {
  height = ctx.canvas.height;
  width = ctx.canvas.width;
  canvasScaledDimensionsRef.value = new Coor(width, height)

  // borderSize = Math.max(height, width) / 10
  borderSize = 100
  xMin = borderSize
  yMin = borderSize
  xMax = width - borderSize
  yMax = height - borderSize

  window.requestAnimationFrame(step);
}

function step() {
  ctx.reset()
  ctx.scale(canvasScaleRef.value, canvasScaleRef.value)
  ctx.translate( canvasOffsetRef.value.x, canvasOffsetRef.value.y )

  ctx.fillStyle = "hsl(100 0% 0% / 20%)"
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = "white"
  ctx.fillRect(xMin, yMin, xMax-xMin, yMax-yMin)

  // Debug rendering
  if (debug) {
    // Add circles at corners
    const offset = canvasOffsetRef.value
    const scaledWidth = canvasScaledDimensionsRef.value.x
    const scaledHeight = canvasScaledDimensionsRef.value.y
    const radius = Math.min(scaledWidth, scaledHeight)/20
    ctx.beginPath();
    ctx.arc(-offset.x,               -offset.y,                radius, (0/2)*Math.PI, (1/2)*Math.PI);
    ctx.moveTo(-offset.x,               -offset.y)
    ctx.lineTo(-offset.x + scaledWidth, -offset.y)
    ctx.arc(-offset.x + scaledWidth, -offset.y,                radius, (1/2)*Math.PI, (2/2)*Math.PI);
    ctx.lineTo(-offset.x + scaledWidth, -offset.y)
    ctx.lineTo(-offset.x + scaledWidth, -offset.y + scaledHeight)
    ctx.arc(-offset.x + scaledWidth, -offset.y + scaledHeight, radius, (2/2)*Math.PI, (3/2)*Math.PI);
    ctx.lineTo(-offset.x + scaledWidth, -offset.y + scaledHeight)
    ctx.lineTo(-offset.x              , -offset.y + scaledHeight)
    ctx.arc(-offset.x              , -offset.y + scaledHeight, radius, (3/2)*Math.PI, (4/2)*Math.PI);
    ctx.lineTo(-offset.x              , -offset.y + scaledHeight)
    ctx.lineTo(-offset.x,               -offset.y)
    ctx.stroke()

    // Add pointerDown coor
    if (lastPointerDownCoor) {
      ctx.beginPath()
      ctx.arc(lastPointerDownCoor.x, lastPointerDownCoor.y, radius, 0, 2*Math.PI)
      ctx.stroke()
      ctx.strokeText(
        `PointerDown Center: (${lastPointerDownCoor.x.toFixed(2)}, ${lastPointerDownCoor.y.toFixed(2)})`,
        lastPointerDownCoor.x,
        lastPointerDownCoor.y
    )
    }

    // Add zoomChange coor
    if (lastZoomChangeCoor) {
      ctx.beginPath()
      ctx.arc(lastZoomChangeCoor.x, lastZoomChangeCoor.y, radius, 0, 2*Math.PI)
      ctx.stroke()
      ctx.strokeText(
        `ZoomChange Center: (${lastZoomChangeCoor.x.toFixed(2)}, ${lastZoomChangeCoor.y.toFixed(2)})`,
        lastZoomChangeCoor.x,
        lastZoomChangeCoor.y
      )
    }
  }

  window.requestAnimationFrame(step);
}

// ************************* PANNING/SCALING *************************
// Panning and zooming. See https://codepen.io/chengarda/pen/wRxoyB for open source example

let canvasOffsetRef = ref(new Coor(0, 0))
let canvasScaledDimensionsRef = ref(new Coor(0, 0))

let canvasZoomLevelRef: Ref<number> = ref(0)
const MIN_ZOOM_LEVEL = -20
const MAX_ZOOM_LEVEL = 20
const ZOOM_SCALE_STEP_SIZE = 2 ** (1/4)

let canvasScaleRef = ref(ZOOM_SCALE_STEP_SIZE ** canvasZoomLevelRef.value)

let isDragging = false
let dragStart = new Coor(0, 0)

function getEventCoor(e: MouseEvent): Coor {
  let coor = null
  if (e instanceof MouseEvent) {
    if (e.clientX && e.clientY) {
      coor = new Coor(e.clientX - e.target.offsetLeft, e.clientY - e.target.offsetTop)
    }
  }

  // console.dir(e.target)

  if (coor === null) {
    throw TypeError(`Event should be a MouseEvent, but was ${e}`)
  }

  // console.log(`${e.type} Event: @ (${coor.x}, ${coor.y})`)
  return coor
}

function getEventScaledCoor(e: MouseEvent): Coor {
  const pointerCoor = getEventCoor(e)
  const scaledPointerX = pointerCoor.x/canvasScaleRef.value - canvasOffsetRef.value.x
  const scaledPointerY = pointerCoor.y/canvasScaleRef.value - canvasOffsetRef.value.y
  // const scaledPointerX = canvasOffsetRef.value.x + pointerCoor.x/canvasScaleRef.value
  // const scaledPointerY = canvasOffsetRef.value.y + pointerCoor.y/canvasScaleRef.value
  const scaledPointerCoor = new Coor(scaledPointerX, scaledPointerY)
  return scaledPointerCoor
}

function onPointerDown(e: MouseEvent) {
  isDragging = true
  const pointerCoor = getEventCoor(e)
  const scaledPointerCoor = getEventScaledCoor(e)
  dragStart = scaledPointerCoor
  lastPointerDownCoor = scaledPointerCoor

  console.log(`onPointerDown: pointerCoor: (${pointerCoor.x.toFixed(2)}, ${pointerCoor.y.toFixed(2)}}) -> scaled: (${scaledPointerCoor.x.toFixed(2)}, ${scaledPointerCoor.y.toFixed(2)}})`)
}

function onPointerUp(e: MouseEvent) {
  isDragging = false
}

function onPointerMove(e: MouseEvent) {
  const pointerCoor = getEventCoor(e)
  console.log(`onPointerMove @ (${pointerCoor.x}, ${pointerCoor.y})`)
  if (isDragging) {
    canvasOffsetRef.value.x = pointerCoor.x/canvasScaleRef.value - dragStart.x
    canvasOffsetRef.value.y = pointerCoor.y/canvasScaleRef.value - dragStart.y
  }
}

function logCanvasDetails(pointerCoor: Coor) {
  console.log(`  Canvas details:`)
  console.log(`    Pointer: (${pointerCoor.x.toFixed(2)}, ${pointerCoor.y.toFixed(2)})`)
  console.log(`    Zoom:    ${canvasZoomLevelRef.value.toFixed(2)}`)
  console.log(`    Scale:   ${canvasScaleRef.value.toFixed(2)}`)
  console.log(`    Offset:  (${canvasOffsetRef.value.x.toFixed(2)}, ${canvasOffsetRef.value.y.toFixed(2)})`)
}

function adjustZoom(e: MouseEvent) {
  const scaledPointerCoor = getEventScaledCoor(e)
  console.log(`Before`)
  logCanvasDetails(scaledPointerCoor)

  if (!isDragging) {
    const zoomLevelChange = (e.deltaY > 0) ? -1 : 1

    canvasZoomLevelRef.value += zoomLevelChange
    canvasZoomLevelRef.value = Math.min(canvasZoomLevelRef.value, MAX_ZOOM_LEVEL)
    canvasZoomLevelRef.value = Math.max(canvasZoomLevelRef.value, MIN_ZOOM_LEVEL)

    const oldCanvasScale = canvasScaleRef.value
    const newCanvasScale = ZOOM_SCALE_STEP_SIZE ** canvasZoomLevelRef.value

    const scaledWidth = width/newCanvasScale
    const scaledHeight = height/newCanvasScale
    canvasScaledDimensionsRef.value = new Coor(scaledWidth, scaledHeight)

    const newOffset = computeOffsetChangeFromZoomChange(oldCanvasScale, newCanvasScale, scaledPointerCoor, canvasOffsetRef.value)

    canvasScaleRef.value = newCanvasScale
    canvasOffsetRef.value = newOffset

    ctx.scale(canvasScaleRef.value, canvasScaleRef.value)
    ctx.translate(Math.round(canvasOffsetRef.value.x), Math.round(canvasOffsetRef.value.y))

    lastZoomChangeCoor = new Coor(scaledPointerCoor.x, scaledPointerCoor.y)

    console.log(`After`)
    logCanvasDetails(scaledPointerCoor)
    console.log(`-----------------------------------`)
  }
}

function computeOffsetChangeFromZoomChange(oldZoom: number, newZoom: number, atCoor: Coor, oldOffset: Coor): Coor {
  console.log(`_adjustZoom`)
  console.log(`  zoom:   ${oldZoom} -> ${newZoom}`)
  console.log(`  atCoor: (${atCoor.x}, ${atCoor.y})`)

  const newOffsetX = -atCoor.x + (oldZoom/newZoom) * (atCoor.x + oldOffset.x) 
  const newOffsetY = -atCoor.y + (oldZoom/newZoom) * (atCoor.y + oldOffset.y)
  const newOffset = new Coor(newOffsetX, newOffsetY)

  console.log(`  offset: (${oldOffset.x.toFixed(3)}, ${oldOffset.y.toFixed(3)}) -> (${newOffset.x.toFixed(3)}, ${newOffset.y.toFixed(3)})`)

  return newOffset
}
</script>
