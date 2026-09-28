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
import { Coor, dist } from '@/models/coor.ts';
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
    // const shapes: ColoredCircle[] = [];

    const currentTimeMillis = document.timeline.currentTime as number
    const shift = currentTimeMillis % 10000 / 10000
    const r = width / 300;
    const X = shift * r;
    const Y = shift * r;
    const theta = shift * Math.PI / 4;

    const shapes: ColoredCircle[] = generateLatticePoints(X, Y, theta, r, width, height).map(
      ({x, y}) => {
        let color = getAverageColor(-x, -y, r, imageData, width, height);
        return new ColoredCircle(-x, -y, r, color);
      }
    )

    // const a = shapes[0].center
    // const b = shapes[1].center
    // const d = dist(a, b)
    // console.log(`dist(${a}, ${b}): ${d}`)
    // return shapes;
}

function generateLatticePoints(X, Y, theta, radius, W, H) {
    const points = [];
    const S = radius * 2; // Grid spacing (diameter)

    // 1. Define the actual bounding box
    // Using Math.min/max makes this safe whether W/H are passed as positive or negative
    const minX = Math.min(0, -W);
    const maxX = Math.max(0, -W);
    const minY = Math.min(0, -H);
    const maxY = Math.max(0, -H);

    const corners = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: minX, y: maxY },
        { x: maxX, y: maxY }
    ];

    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    let minA = Infinity, maxA = -Infinity;
    let minB = Infinity, maxB = -Infinity;

    // 2. Map the 4 corners into (a, b) grid space using the inverse matrix
    for (const c of corners) {
        const dx = c.x - X;
        const dy = c.y - Y;

        // Inverse transform to find grid steps 'a' and 'b' for this corner
        const a = (-dx * sin + dy * cos) / S;
        const b = (dx * cos + dy * sin) / S;

        minA = Math.min(minA, a);
        maxA = Math.max(maxA, a);
        minB = Math.min(minB, b);
        maxB = Math.max(maxB, b);
    }

    // 3. Round to outer integers to ensure we cover the whole area
    const startA = Math.floor(minA);
    const endA = Math.ceil(maxA);
    const startB = Math.floor(minB);
    const endB = Math.ceil(maxB);

    // 4. Loop over the known bounding box in grid space
    for (let a = startA; a <= endA; a++) {
        for (let b = startB; b <= endB; b++) {
            // Your forward formula
            const x = X - a * S * sin + b * S * cos;
            const y = Y + a * S * cos + b * S * sin;

            // 5. Strict bounding box check
            // (Adding a tiny tolerance for JS floating-point inaccuracies)
            const tol = 1e-9;
            if (x >= minX - tol && x <= maxX + tol &&
                y >= minY - tol && y <= maxY + tol) {
                points.push({ x, y });
            }
        }
    }

    return points;
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