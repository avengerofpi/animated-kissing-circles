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
    <div>Canvas Line Width: ({{ canvasLineWidthRef.toFixed(4) }})</div>
  </div>
  <!-- Canvas -->
  <div>
    <canvas ref="canvasRef" tabindex=1 width="900" height="600" style="border:1px solid #d3d3d3;"></canvas>
  </div>
</template>

<script setup lang="ts">
// https://vuejs.org/guide/typescript/composition-api
const props = defineProps<{
  animating: boolean
}>()

import { ref, onMounted, watch } from 'vue'
import type { Ref } from 'vue'
import { Coor } from '@/models/coor'
import { Dimensions } from '@/models/dimensions'
import { debounce } from 'lodash'

const toggleAnimating: Ref<Function> = defineModel<Function>("toggleAnimating", { required: true, default: () => {} })
const addShapes: Ref<Function> = defineModel<Function>("addShapes", { required: true, default: (ctx: CanvasRenderingContext2D, timestamp: number) => {} })
const addDebugShapes: Ref<Function> = defineModel<Function>("addDebugShapes", { required: true, default: (ctx) => {} })
const stepAtLeastOnce: Ref<boolean> = defineModel<boolean>("stepAtLeastOnce", { required: true, default: true })

let ctx: CanvasRenderingContext2D
const canvasRef: Ref<HTMLCanvasElement | null> = ref(null)
let canvasStream: MediaStream

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
    mediaRecorder = new MediaRecorder(canvasStream)

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
    canvasRef.value.addEventListener('mouseover', onPointerOver)
    canvasRef.value.addEventListener('wheel', adjustZoom, {passive: false} )
    canvasRef.value.addEventListener('dblclick', zoomInOneLevel)
    canvasRef.value.addEventListener('keyup', onKeyUp)
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

  if (canvasRef.value) {
    canvasStream = canvasRef.value.captureStream(60)
  }

  window.requestAnimationFrame(step);
}

function resetCanvas() {
  ctx.reset()
  ctx.scale(canvasScaleRef.value, canvasScaleRef.value)
  ctx.lineWidth = canvasLineWidthRef.value
  ctx.translate(canvasOffsetRef.value.x, canvasOffsetRef.value.y)

  ctx.fillStyle = "white"
  ctx.fillRect(
    -canvasOffsetRef.value.x, -canvasOffsetRef.value.y,
    canvasRef.value.width/canvasScaleRef.value, canvasRef.value.height/canvasScaleRef.value
  )
  addShadedBorder()
}

function addShadedBorder() {
  const borderSize = 100

  const outerBoarderUpperLeftCorner = new Coor(-initialWidth / 2, -initialHeight / 2)
  const outerBoarderDimensions = new Dimensions(initialWidth, initialHeight)

  const currentFillStyle = ctx.fillStyle
  const transparentGray = "hsl(100 0% 0% / 20%)"
  ctx.fillStyle = transparentGray
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

  ctx.fillStyle = currentFillStyle
}

function addCirclesAtCornersOfCanvas() {
  const scaledWidth = canvasScaledDimensionsRef.value.x
  const scaledHeight = canvasScaledDimensionsRef.value.y
  const radius = Math.min(scaledWidth, scaledHeight) / 20
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
  const origLineWidth = ctx.lineWidth
  const origLineDash = ctx.getLineDash()

  ctx.lineWidth = origLineWidth * 0.25
  ctx.setLineDash([4, 6]);

  const crosshairWidth = initialWidth*3 - ((initialWidth*3) % 20) + 24
  const crosshairHeight = initialHeight*3 - ((initialHeight*3) % 20) + 24

  ctx.beginPath();
  ctx.moveTo(-crosshairWidth / 2, 0)
  ctx.lineTo(crosshairWidth / 2, 0)
  ctx.moveTo(0, -crosshairHeight / 2)
  ctx.lineTo(0, crosshairHeight / 2)
  ctx.stroke()

  ctx.lineWidth = origLineWidth
  ctx.setLineDash(origLineDash)
}

function addPointerDownCoor() {
  const scaledWidth = canvasScaledDimensionsRef.value.x
  const scaledHeight = canvasScaledDimensionsRef.value.y
  const radius = Math.min(scaledWidth, scaledHeight) / 20

  ctx.beginPath()
  ctx.arc(lastPointerDownCoor.x, lastPointerDownCoor.y, radius, 0, 2*Math.PI)
  ctx.stroke()
  ctx.strokeText(
    `PointerDown Center: (${lastPointerDownCoor.x.toFixed(2)}, ${lastPointerDownCoor.y.toFixed(2)})`,
    lastPointerDownCoor.x,
    lastPointerDownCoor.y
  )
}

function addZoomChangeCoor() {
  const scaledWidth = canvasScaledDimensionsRef.value.x
  const scaledHeight = canvasScaledDimensionsRef.value.y
  const radius = Math.min(scaledWidth, scaledHeight) / 20

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

    addCirclesAtCornersOfCanvas()
    lastPointerDownCoor && addPointerDownCoor()
    lastZoomChangeCoor  && addZoomChangeCoor()
  }
}

let startTimeMillis, currentTimeMillis, timeDiffMillis, frameRate, numSteps = 0
let startTimeMillisAnimating, timeDiffMillisAnimating, frameRateAnimating, numStepsAnimating = 0

function step(timestamp: number) {
  if (props.animating) {
    currentTimeMillis = (document.timeline.currentTime as number)
    startTimeMillis = startTimeMillis || currentTimeMillis
    numSteps += 1

    startTimeMillisAnimating = startTimeMillisAnimating || currentTimeMillis
    timeDiffMillis = currentTimeMillis - startTimeMillis
    timeDiffMillisAnimating = currentTimeMillis - startTimeMillisAnimating
    numStepsAnimating += 1
    frameRate = numSteps / (timeDiffMillis / 1000)
    frameRateAnimating = numStepsAnimating / (timeDiffMillisAnimating / 1000)
    // console.log(`avg framerate: ${frameRate.toFixed(2)} (animating: ${frameRateAnimating.toFixed(2)})`)
  }

  if (props.animating || stepAtLeastOnce.value) {
    resetCanvas()
    addShapes.value(ctx, timestamp)
    debugModeAnimations()
    stepAtLeastOnce.value = false
    addCrosshairsAtOrigin()
  }
  window.requestAnimationFrame(step);
}

function handleResize(e: Event) {
  updateCanvasSize()
}
const debouncedHandleResize = debounce(handleResize, 50)

function updateCanvasSize() {
  const height = (window.innerHeight - 200)
  const width = (window.innerWidth - 100)
  if (canvasRef.value) {
    canvasRef.value.height = height
    canvasRef.value.width = width
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

let canvasOffsetRef: Ref<Coor> = ref(new Coor(0, 0))
let canvasScaledDimensionsRef: Ref<Coor> = ref(new Coor(0, 0))

let canvasZoomLevelRef: Ref<number> = ref(0)
const MIN_ZOOM_LEVEL = -40
const MAX_ZOOM_LEVEL = 20
const ZOOM_SCALE_STEP_SIZE = 2 ** (1/4)

let canvasScaleRef = ref(ZOOM_SCALE_STEP_SIZE ** canvasZoomLevelRef.value)
let canvasLineWidthRef = ref(1)

let isDragging = false
let dragStart = new Coor(0, 0)

// Constants to help with using the MouseEvent.button prop
// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
const LEFT_MOUSEBUTTON_NUM = 0 // main
const WHEEL_MOUSEBUTTON_NUM = 1 // auxillary
const RIGHT_MOUSEBUTTON_NUM = 2 // secondary
const BACK_MOUSEBUTTON_NUM = 3 // fourth button
const FORWARD_MOUSEBUTTON_NUM = 4 // fifth button

// Constants to help with using the MouseEvent.buttons prop
// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
const LEFT_MOUSEBUTTONS_NUM = 1 // main
const WHEEL_MOUSEBUTTONS_NUM = 2 // auxillary
const RIGHT_MOUSEBUTTONS_NUM = 4 // secondary
const BACK_MOUSEBUTTONS_NUM = 8 // fourth button
const FORWARD_MOUSEBUTTONS_NUM = 16 // fifth button

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

function onPointerOver(e: MouseEvent) {
  const leftMouseButtonIsDown = e.buttons & LEFT_MOUSEBUTTONS_NUM
  if (isDragging && !leftMouseButtonIsDown) {
    isDragging = false
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key === "SpaceBar" || e.key === " ") {
    toggleAnimating.value()
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

  // Update line width
  let lineWidth = 1
  if (canvasScaleRef.value > 1) {
    lineWidth = 0.95**canvasScaleRef.value
  }
  canvasLineWidthRef.value = lineWidth

  // Update offset
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
