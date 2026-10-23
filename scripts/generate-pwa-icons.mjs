import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "app", "icon.svg");
const outDir = path.join(root, "public", "icons");
const svg = await readFile(source);

await mkdir(outDir, { recursive: true });

const square = (size) =>
  sharp(svg)
    .resize(size, size)
    .flatten({ background: "#030712" })
    .png({ compressionLevel: 9, palette: true })
    .toFile(path.join(outDir, `icon-${size}.png`));

await Promise.all([square(192), square(512)]);

const maskableSize = 512;
const inner = Math.round(maskableSize * 0.8);
const innerBuffer = await sharp(svg)
  .resize(inner, inner)
  .flatten({ background: "#030712" })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: maskableSize,
    height: maskableSize,
    channels: 4,
    background: "#030712",
  },
})
  .composite([{ input: innerBuffer, gravity: "center" }])
  .png({ compressionLevel: 9, palette: true })
  .toFile(path.join(outDir, "maskable-512.png"));

await sharp(svg)
  .resize(180, 180)
  .flatten({ background: "#030712" })
  .png({ compressionLevel: 9 })
  .toFile(path.join(outDir, "apple-touch-icon.png"));

console.log("Generated PWA icons in public/icons");
