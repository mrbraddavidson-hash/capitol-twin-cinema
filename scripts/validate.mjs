import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "public/index.html",
  "public/robots.txt",
  "public/sitemap.xml",
  "public/_headers",
  "public/assets/styles.css",
  "public/assets/fonts.css",
  "public/assets/capitol_logo.png"
];

await Promise.all(requiredFiles.map((file) => access(file)));

const html = await readFile("public/index.html", "utf8");
const forbidden = [
  "cdn.tailwindcss.com",
  "capitoltwincinema.pages.dev",
  "The Wild Robot",
  "Beetlejuice Beetlejuice",
  "handleFormSubmit",
  "loyalty",
  "free pass",
  "punch card",
  "brand_collage.jpg"
];

const found = forbidden.filter((value) => html.includes(value));
if (found.length) {
  throw new Error(`Unsafe or stale production content found: ${found.join(", ")}`);
}

for (const fragment of ["showtimes", "pricing", "experience", "concessions", "rentals", "contact"]) {
  if (!html.includes(`id="${fragment}"`)) {
    throw new Error(`Missing internal destination: #${fragment}`);
  }
}

console.log("Static-site validation passed.");
