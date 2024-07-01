<template>
  <!-- Debug Canvas Details -->
  <div>
    <input type="checkbox" id="debug-checkbox" v-model="debug">
    <label for="debug-checkbox">&nbsp;Debug</label>
  </div>
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
const props = defineProps<{
  animating: boolean
}>()

import { ref, onMounted } from 'vue'
import type { Ref } from 'vue'
import { Coor } from '../models/coor'
import { debounce } from 'lodash'

const addShapes: Ref<Function> = defineModel<Function>("addShapes", { required: true, default: (ctx, timestamp) => {} })
const stepAtLeastOnce: Ref<boolean> = defineModel<boolean>("stepAtLeastOnce", { required: true, default: true })

let ctx: CanvasRenderingContext2D
const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)

const debug: Ref<boolean> = ref(true)

let height: number
let width: number
let borderSize: number
let xMin: number
let yMin: number
let xMax: number
let yMax: number

let lastPointerDownCoor: Coor
let lastZoomChangeCoor: Coor

onMounted(() => {
  if (canvasRef.value) {
    updateCanvasSize()
    ctx = canvasRef.value.getContext("2d") as CanvasRenderingContext2D
    canvasRef.value.addEventListener('mousedown', onPointerDown)
    canvasRef.value.addEventListener('mouseup', onPointerUp)
    canvasRef.value.addEventListener('mousemove', onPointerMove)
    canvasRef.value.addEventListener('wheel', adjustZoom, {passive: false} )
    canvasRef.value.addEventListener('dblclick', zoomInOneLevel)
    addEventListener("resize", debouncedHandleResize);

    initAndAnimate()
  } else {
    console.error('ERROR! The required <canvas> HTML element was not available after mount.')
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

function resetCanvas() {
  ctx.reset()
  ctx.scale(canvasScaleRef.value, canvasScaleRef.value)
  ctx.translate( canvasOffsetRef.value.x, canvasOffsetRef.value.y )

  ctx.fillStyle = "hsl(100 0% 0% / 20%)"
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = "white"
  ctx.fillRect(xMin, yMin, xMax-xMin, yMax-yMin)
}

function addCirclesAtCornersOfCanvas(radius: number, scaledWidth: number, scaledHeight: number) {
  const offset = canvasOffsetRef.value

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
}

function addPointerDownCoor(radius: number) {
  ctx.beginPath()
  ctx.arc(lastPointerDownCoor.x, lastPointerDownCoor.y, radius, 0, 2*Math.PI)
  ctx.stroke()
  ctx.strokeText(
    `PointerDown Center: (${lastPointerDownCoor.x.toFixed(2)}, ${lastPointerDownCoor.y.toFixed(2)})`,
    lastPointerDownCoor.x,
    lastPointerDownCoor.y
  )
}

function addZoomChangeCoor(radius: number) {
  ctx.beginPath()
  ctx.arc(lastZoomChangeCoor.x, lastZoomChangeCoor.y, radius, 0, 2*Math.PI)
  ctx.stroke()
  ctx.strokeText(
    `ZoomChange Center: (${lastZoomChangeCoor.x.toFixed(2)}, ${lastZoomChangeCoor.y.toFixed(2)})`,
    lastZoomChangeCoor.x,
    lastZoomChangeCoor.y
  )
}

function debugModeAnimations() {
  if (debug.value) {
    const scaledWidth = canvasScaledDimensionsRef.value.x
    const scaledHeight = canvasScaledDimensionsRef.value.y
    const radius = Math.min(scaledWidth, scaledHeight)/20

    addCirclesAtCornersOfCanvas(radius, scaledWidth, scaledHeight)
    lastPointerDownCoor && addPointerDownCoor(radius)
    lastZoomChangeCoor  && addZoomChangeCoor(radius)
  }
}

function step(timestamp: number) {
  if (props.animating || stepAtLeastOnce.value) {
    resetCanvas()
    addShapes.value(ctx, timestamp)
    debugModeAnimations()
    stepAtLeastOnce.value = false
}
  window.requestAnimationFrame(step);
}

function handleResize(e: Event) {
  updateCanvasSize()
}

function updateCanvasSize() {
  canvasRef.value.height = window.innerHeight - 200;
  canvasRef.value.width = window.innerWidth - 100;
  stepAtLeastOnce.value = true
  console.log(`canvas resized to ${canvasRef.value.width} x ${canvasRef.value?.height}`)
}

const debouncedHandleResize = debounce(handleResize, 50)

// ************************* PANNING/SCALING *************************
// Panning and zooming. See https://codepen.io/chengarda/pen/wRxoyB for open source example

let canvasOffsetRef = ref(new Coor(0, 0))
let canvasScaledDimensionsRef = ref(new Coor(0, 0))

let canvasZoomLevelRef: Ref<number> = ref(0)
const MIN_ZOOM_LEVEL = -40
const MAX_ZOOM_LEVEL = 20
const ZOOM_SCALE_STEP_SIZE = 2 ** (1/4)

let canvasScaleRef = ref(ZOOM_SCALE_STEP_SIZE ** canvasZoomLevelRef.value)

let isDragging = false
let dragStart = new Coor(0, 0)

function getEventCoor(e: MouseEvent): Coor {
  let coor = null
  if (e instanceof MouseEvent) {
    if (e.clientX && e.clientY) {
      coor = new Coor(
        e.clientX - e.target.offsetLeft + document.scrollingElement.scrollLeft,
        e.clientY - e.target.offsetTop + document.scrollingElement.scrollTop
      )
    }
  }

  if (coor === null) {
    throw TypeError(`Event should be a MouseEvent, but was ${e}`)
  }

  // console.log(`${e.type} Event: @ (${coor.x}, ${coor.y})`)
  return coor
}

function getEventScaledCoor(e: MouseEvent): Coor {
  stepAtLeastOnce.value = true
  const pointerCoor = getEventCoor(e)
  const scaledPointerX = pointerCoor.x/canvasScaleRef.value - canvasOffsetRef.value.x
  const scaledPointerY = pointerCoor.y/canvasScaleRef.value - canvasOffsetRef.value.y
  const scaledPointerCoor = new Coor(scaledPointerX, scaledPointerY)
  return scaledPointerCoor
}

function onPointerDown(e: MouseEvent) {
  const scaledPointerCoor = getEventScaledCoor(e)
  lastPointerDownCoor = scaledPointerCoor

  // Prevent a non-Left Mouse Button click from starting a dragging session
  const LEFT_MOUSEBUTTON_NUM = 0
  if (e.button === LEFT_MOUSEBUTTON_NUM) {
    isDragging = true
    dragStart = scaledPointerCoor
  }
}

function onPointerUp(e: MouseEvent) {
  isDragging = false
}

function onPointerMove(e: MouseEvent) {
  const pointerCoor = getEventCoor(e)
  if (isDragging) {
    stepAtLeastOnce.value = true
    canvasOffsetRef.value.x = pointerCoor.x/canvasScaleRef.value - dragStart.x
    canvasOffsetRef.value.y = pointerCoor.y/canvasScaleRef.value - dragStart.y
  }
}

function zoomToLevelAtCoor(newZoomLevel: number, scaledPointerCoor: Coor) {
  stepAtLeastOnce.value = true
  canvasZoomLevelRef.value = newZoomLevel
  canvasZoomLevelRef.value = Math.min(canvasZoomLevelRef.value, MAX_ZOOM_LEVEL)
  canvasZoomLevelRef.value = Math.max(canvasZoomLevelRef.value, MIN_ZOOM_LEVEL)

  const oldCanvasScale = canvasScaleRef.value
  const newCanvasScale = ZOOM_SCALE_STEP_SIZE ** newZoomLevel

  const scaledWidth = width/newCanvasScale
  const scaledHeight = height/newCanvasScale
  canvasScaledDimensionsRef.value = new Coor(scaledWidth, scaledHeight)

  const newOffset = computeOffsetChangeFromZoomChange(oldCanvasScale, newCanvasScale, scaledPointerCoor, canvasOffsetRef.value)

  canvasScaleRef.value = newCanvasScale
  canvasOffsetRef.value = newOffset

  ctx.scale(canvasScaleRef.value, canvasScaleRef.value)
  ctx.translate(Math.round(canvasOffsetRef.value.x), Math.round(canvasOffsetRef.value.y))

  lastZoomChangeCoor = new Coor(scaledPointerCoor.x, scaledPointerCoor.y)
}

function adjustZoom(e: MouseEvent) {
  e.preventDefault()
  const scaledPointerCoor = getEventScaledCoor(e)

  if (!isDragging) {
    const zoomLevelChange = (e.deltaY > 0) ? -1 : 1
    const newZoomLevel = canvasZoomLevelRef.value + zoomLevelChange
    zoomToLevelAtCoor(newZoomLevel, scaledPointerCoor)
  }
}

function zoomInOneLevel(e: MouseEvent) {
  const scaledPointerCoor = getEventScaledCoor(e)
  const zoomLevelChange = 1
  const newZoomLevel = canvasZoomLevelRef.value + zoomLevelChange
  zoomToLevelAtCoor(newZoomLevel, scaledPointerCoor)
}

function computeOffsetChangeFromZoomChange(oldZoom: number, newZoom: number, atCoor: Coor, oldOffset: Coor): Coor {
  const newOffsetX = -atCoor.x + (oldZoom/newZoom) * (atCoor.x + oldOffset.x) 
  const newOffsetY = -atCoor.y + (oldZoom/newZoom) * (atCoor.y + oldOffset.y)
  const newOffset = new Coor(newOffsetX, newOffsetY)

  return newOffset
}
</script>
