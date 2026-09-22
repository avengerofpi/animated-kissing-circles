<template>
  <!-- Header -->
  <h3>Replace a Picture with Circles</h3>

  <!-- Buttons -->
  <div class="controls">
      <!-- @change is the Vue way to listen to native change events -->
      <input type="file" id="imageLoader" accept="image/*" @change="handleImageChange"/>

      <!-- FIX: Changed onclick to @click -->
      <button @click="toggleAnimating">Process Image</button>
  </div>

  <p v-if="statusMessage" class="status">{{ statusMessage }}</p>

  <!-- Canvas -->
  <!-- Note: If BaseCanvas doesn't actually mutate these functions,
       you should change `v-model:name` to standard props `:name` -->
  <BaseCanvas
    v-model:animating="animating"
    v-model:step-at-least-once="stepAtLeastOnce"
    :toggle-animating="toggleAnimating"
    :add-shapes="addShapes"
    :add-debug-shapes="addDebugShapes"
    ref="baseCanvasRef"
  >
  </BaseCanvas>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Ref } from 'vue'

import BaseCanvas from './BaseCanvas.vue';
import { Coor } from '@/models/coor.ts';
import { ColoredCircle } from '@/models/circle.ts';

// --- State Variables ---
const animating = ref<boolean>(false)
const stopAnimationFlag = ref<boolean>(false)
const stepAtLeastOnce = ref<boolean>(true)
// const canvasRef = ref<HTMLCanvasElement | null>(null)
const baseCanvasRef = ref<InstanceType<typeof BaseCanvas> | null>(null);
const imageLoaded = ref<boolean>(false);
const statusMessage = ref<string>('');

// --- Non-reactive Variables ---
let sourceImageData: ImageData | null = null;
let imgWidth = 100;
let imgHeight = 100;

// --- Configuration ---
const ATTEMPTS = 25000;
const MIN_RADIUS = 2;
const MAX_RADIUS = 4;

// --- Functions (No need to wrap these in ref!) ---

function toggleAnimating() {
  if (animating.value) {
    stopAnimationFlag.value = true
  } else {
    animate()
  }
}

function addDebugShapes() {
  // Debug logic
}

function handleImageChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  renderImage(file)
}

function renderImage(file: File) {
  const reader = new FileReader();
  reader.onload = function(e: ProgressEvent<FileReader>) {
    const img = new Image();
    img.onload = () => {
      if (!baseCanvasRef.value?.canvas) return;

      imgWidth = img.width;
      imgHeight = img.height;

      const canvas = baseCanvasRef.value?.canvas
      canvas.width = imgWidth;
      canvas.height = imgHeight;

      const ctx = baseCanvasRef.value?.canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
      sourceImageData = ctx.getImageData(0, 0, imgWidth, imgHeight);

      imageLoaded.value = true;
      statusMessage.value = "Image loaded. Ready to process.";
    };

    if (typeof e.target?.result === 'string') {
      img.src = e.target.result;
    }
  };
  reader.readAsDataURL(file);
}

const getAverageColor = (
  x: number,
  y: number,
  r: number,
  imageData: ImageData,
  width: number,
  height: number
): string => {
  let rSum = 0, gSum = 0, bSum = 0, count = 0;

  // Define bounding box for the circle
  const minX = Math.max(0, Math.floor(x - r));
  const maxX = Math.min(width - 1, Math.ceil(x + r));
  const minY = Math.max(0, Math.floor(y - r));
  const maxY = Math.min(height - 1, Math.ceil(y + r));

  const rSquared = r * r;

  // Scan pixels within bounding box
  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const dx = px - x;
      const dy = py - y;

      // If pixel is inside the circle
      if (dx * dx + dy * dy <= rSquared) {
        const index = (py * width + px) * 4;
        rSum += imageData.data[index];
        gSum += imageData.data[index + 1];
        bSum += imageData.data[index + 2];
        count++;
      }
    }
  }

  // Fallback for extremely small radii where count might be 0
  if (count === 0) {
    const px = Math.max(0, Math.min(width - 1, Math.floor(x)));
    const py = Math.max(0, Math.min(height - 1, Math.floor(y)));
    const index = (py * width + px) * 4;
    return `rgb(${imageData.data[index]},${imageData.data[index+1]},${imageData.data[index+2]})`;
  }

  return `rgb(${Math.round(rSum/count)},${Math.round(gSum/count)},${Math.round(bSum/count)})`;
};

const generateCircles = (
  imageData: ImageData,
  width: number,
  height: number,
  numAttempts: number
): ColoredCircle[] => {
    const shapes: ColoredCircle[] = [];

    const X = Math.random();
    const Y = Math.random();
    const theta = Math.random() * Math.PI / 2;
    const r = 50;
    const dx = 2 * r * Math.cos(theta);
    const dy = 2 * r * Math.sin(theta);

    for (let x = X; x < width; x+=dx) {
        for (let y = Y; y < height; y+=dy) {
            let color = getAverageColor(x, y, r, imageData, width, height);
            shapes.push(new ColoredCircle(x, y, r, color));
        }
    }

    return shapes;
}

// 4. Inverse Render Logic
function addShapes() {
    if (!sourceImageData || !baseCanvasRef.value?.canvas) return;

    const ctx = baseCanvasRef.value?.canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, baseCanvasRef.value?.canvas.width, baseCanvasRef.value?.canvas.height);

    const packedCircles = generateCircles(sourceImageData, baseCanvasRef.value?.canvas.width, baseCanvasRef.value?.canvas.height, ATTEMPTS);

    // Save default context state
    ctx.save();

    // Draw perfect circles in the transformed context
    packedCircles.forEach(shape => shape.draw(ctx));

    // Restore default context state
    ctx.restore();
}

function animate() {
  addShapes()
}
</script>