/**
 * Compile portrait images to .mind files for MindAR image tracking.
 * Run: node scripts/compile-mind.mjs
 *
 * Requires: mind-ar installed (npm install mind-ar --save-dev)
 * Also requires: canvas (npm install canvas --save-dev) for Node.js Image support
 */

import { readFileSync, writeFileSync } from 'fs'
import { createCanvas, loadImage } from 'canvas'
import { Compiler } from 'mind-ar/dist/mindar-image.prod.js'

async function compileImage(inputPath, outputPath) {
  console.log(`Compiling ${inputPath} ...`)
  const img = await loadImage(inputPath)

  // Draw to canvas so we have a proper HTMLImageElement-like object
  const canvas = createCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)

  const compiler = new Compiler()
  await compiler.compileImageTargets([canvas], (progress) => {
    process.stdout.write(`\r  Progress: ${progress.toFixed(1)}%`)
  })
  console.log()

  const buffer = await compiler.exportData()
  writeFileSync(outputPath, Buffer.from(buffer))
  console.log(`  ✓ Saved to ${outputPath}`)
}

await compileImage('public/tinubu.png', 'public/tinubu.mind')
await compileImage('public/sanwo-olu.png', 'public/sanwo-olu.mind')
console.log('Done!')
