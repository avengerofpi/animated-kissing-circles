<template>
  <div>
    <!-- Debug Canvas Details -->
    <div>
      <input type="checkbox" id="debug-checkbox" v-model="debug">
      <label for="debug-checkbox">&nbsp;Debug</label>
    </div>
    <!-- Video recording -->
    <div>
      <!-- <input type="checkbox" id="stream-checkbox" v-model="recording" :disabled="recording"> -->
      <input type="checkbox" id="stream-checkbox" v-model="recordingFlag">
      <label for="stream-checkbox">&nbsp;Capture Video Stream</label>
    </div>
    <a ref="downloadRef" download="kissing-circles.mp4">Download the most recent recording</a>
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

import { ref, onMounted, watch } from 'vue'
import type { Ref } from 'vue'
import { Coor } from '../models/coor'
import { Dimensions } from '../models/dimensions'
import { debounce } from 'lodash'

const addShapes: Ref<Function> = defineModel<Function>("addShapes", { required: true, default: (ctx, timestamp) => {} })
const addDebugShapes: Ref<Function> = defineModel<Function>("addDebugShapes", { required: true, default: (ctx) => {} })
const stepAtLeastOnce: Ref<boolean> = defineModel<boolean>("stepAtLeastOnce", { required: true, default: true })

let ctx: CanvasRenderingContext2D
const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)

const debug: Ref<boolean> = ref(false)
const recordingFlag: Ref<boolean> = ref(false)
const downloadRef: Ref<HTMLAnchorElement | null> = ref(null)
let mediaRecorder: MediaRecorder
let videoChunks: Blob[] = []

let initialHeight: number
let initialWidth: number

let lastPointerDownCoor: Coor
let lastZoomChangeCoor: Coor

watch(debug, newDebugValue => {
  stepAtLeastOnce.value = true
})

watch(recordingFlag, (isRecording, wasRecording) => {
  console.log(`toggled recording: ${wasRecording} -> ${isRecording}`)
  if (!canvasRef.value) return

  if (isRecording) {
    const stream = canvasRef.value.captureStream(60)
    mediaRecorder = new MediaRecorder(stream)

    mediaRecorder.start();
    if (downloadRef.value) {
      downloadRef.value.removeAttribute("href")
    }
    console.log(`mediaRecorder.state: ${mediaRecorder.state}`);
    console.log("recorder started");

    mediaRecorder.onstop = (e) => {
      console.log("data available after MediaRecorder.stop() called.")

      const blob = new Blob(videoChunks, { type: "video/mp4" })
      const blobUrl = URL.createObjectURL(blob)
      videoChunks = []

      if (downloadRef.value) {
        downloadRef.value.href = blobUrl
      }
    }

  mediaRecorder.ondataavailable = (e) => {
    videoChunks.push(e.data);
  };

    stepAtLeastOnce.value = true
  } else {
    mediaRecorder.stop();
    console.log(`mediaRecorder.state: ${mediaRecorder.state}`);
    console.log("recorder stopped");
  }
})

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext("2d") as CanvasRenderingContext2D
    canvasRef.value.addEventListener('mousedown', onPointerDown)
    canvasRef.value.addEventListener('mouseup', onPointerUp)
    canvasRef.value.addEventListener('mousemove', onPointerMove)
    canvasRef.value.addEventListener('wheel', adjustZoom, {passive: false} )
    canvasRef.value.addEventListener('dblclick', zoomInOneLevel)
    addEventListener("resize", debouncedHandleResize);

    updateCanvasSize()
    initAndAnimate()
  } else {
    console.error('ERROR! The required <canvas> HTML element was not available after mount.')
  }
})

function initAndAnimate() {
  initialHeight = ctx.canvas.height;
  initialWidth = ctx.canvas.width;

  canvasOffsetRef.value = new Coor(initialWidth / 2, initialHeight / 2)

  window.requestAnimationFrame(step);
}

function resetCanvas() {
  ctx.reset()
  ctx.scale(canvasScaleRef.value, canvasScaleRef.value)
  ctx.translate(canvasOffsetRef.value.x, canvasOffsetRef.value.y)

  addShadedBorder()
  addCrosshairsAtOrigin()
}

function addShadedBorder() {
  const borderSize = 100

  const outerBoarderUpperLeftCorner = new Coor(-initialWidth / 2, -initialHeight / 2)
  const outerBoarderDimensions = new Dimensions(initialWidth, initialHeight)

  ctx.fillStyle = "hsl(100 0% 0% / 20%)"
  ctx.fillRect(
    outerBoarderUpperLeftCorner.x, outerBoarderUpperLeftCorner.y,
    outerBoarderDimensions.width, outerBoarderDimensions.height
  )

  const innerBoarderUpperLeftCorner = new Coor(-(initialWidth / 2) + borderSize, -(initialHeight / 2) + borderSize)
  const innerBoarderDimensions = new Dimensions(initialWidth - (2 * borderSize), initialHeight - (2 * borderSize))

  ctx.fillStyle = "white"
  ctx.fillRect(
    innerBoarderUpperLeftCorner.x, innerBoarderUpperLeftCorner.y,
    innerBoarderDimensions.width, innerBoarderDimensions.height
  )
}

function addCirclesAtCornersOfCanvas(radius: number, scaledWidth: number, scaledHeight: number) {
  const offset = canvasOffsetRef.value

  ctx.beginPath();
  ctx.arc(-offset.x, -offset.y, radius, (0/2)*Math.PI, (1/2)*Math.PI);
  ctx.moveTo(-offset.x, -offset.y)
  ctx.lineTo(-offset.x + scaledWidth, -offset.y)
  ctx.arc(-offset.x + scaledWidth, -offset.y, radius, (1/2)*Math.PI, (2/2)*Math.PI);
  ctx.lineTo(-offset.x + scaledWidth, -offset.y)
  ctx.lineTo(-offset.x + scaledWidth, -offset.y + scaledHeight)
  ctx.arc(-offset.x + scaledWidth, -offset.y + scaledHeight, radius, (2/2)*Math.PI, (3/2)*Math.PI);
  ctx.lineTo(-offset.x + scaledWidth, -offset.y + scaledHeight)
  ctx.lineTo(-offset.x, -offset.y + scaledHeight)
  ctx.arc(-offset.x, -offset.y + scaledHeight, radius, (3/2)*Math.PI, (4/2)*Math.PI);
  ctx.lineTo(-offset.x, -offset.y + scaledHeight)
  ctx.lineTo(-offset.x, -offset.y)
  ctx.stroke()
}

function addCrosshairsAtOrigin() {
  const crosshairWidth = 264 // 26 * (4 + 6) + 4
  const crosshairHeight = 164 // 16 * (4 + 6) + 4

  ctx.beginPath();
  ctx.setLineDash([4, 6]);
  ctx.moveTo(-crosshairWidth / 2, 0)
  ctx.lineTo(crosshairWidth / 2, 0)
  ctx.moveTo(0, -crosshairHeight / 2)
  ctx.lineTo(0, crosshairHeight / 2)
  ctx.stroke()
  ctx.setLineDash([]);
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
    addDebugShapes.value(ctx)

    const scaledWidth = canvasScaledDimensionsRef.value.x
    const scaledHeight = canvasScaledDimensionsRef.value.y
    const radius = Math.min(scaledWidth, scaledHeight) / 20

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
const debouncedHandleResize = debounce(handleResize, 50)

function updateCanvasSize() {
  if (canvasRef.value) {
    canvasRef.value.height = window.innerHeight - 200;
    canvasRef.value.width = window.innerWidth - 100;
  }

  updateCanvasScaledDimensions()

  stepAtLeastOnce.value = true
  console.log(`canvas resized to ${canvasRef.value?.width} x ${canvasRef.value?.height}`)
}

function updateCanvasScaledDimensions() {
  if (canvasRef.value) {
    const scaledWidth = canvasRef.value.width / canvasScaleRef.value
    const scaledHeight = canvasRef.value.height / canvasScaleRef.value
    canvasScaledDimensionsRef.value = new Coor(scaledWidth, scaledHeight)
  }
}

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
  canvasScaleRef.value = newCanvasScale

  const newOffset = computeOffsetChangeFromZoomChange(oldCanvasScale, newCanvasScale, scaledPointerCoor, canvasOffsetRef.value)
  canvasOffsetRef.value = newOffset

  updateCanvasScaledDimensions()

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
