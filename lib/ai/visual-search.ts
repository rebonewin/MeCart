export type VisualCandidate = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  categoryName: string;
  brandName: string;
  subCategoryName: string;
  colors: string[];
  rating: number;
  reviewCount: number;
};

export type VisualMatch = VisualCandidate & {
  confidence: number;
  reason: string;
};

export type VisualAnalysis = {
  average: { r: number; g: number; b: number };
  hex: string;
  luminance: number;
  saturation: number;
  palette: { r: number; g: number; b: number; weight: number }[];
};

export type VisualSearchProvider = {
  id: string;
  label: string;
  remote: boolean;
  search: (input: {
    file: File;
    analysis: VisualAnalysis;
    candidates: VisualCandidate[];
  }) => Promise<VisualMatch[]>;
};

const COLOR_ANCHORS: { name: string; r: number; g: number; b: number }[] = [
  { name: "Black", r: 20, g: 20, b: 24 },
  { name: "Charcoal", r: 55, g: 58, b: 64 },
  { name: "Grey", r: 128, g: 132, b: 138 },
  { name: "Silver", r: 190, g: 194, b: 200 },
  { name: "White", r: 247, g: 246, b: 242 },
  { name: "Ivory", r: 239, g: 230, b: 210 },
  { name: "Cream", r: 244, g: 226, b: 190 },
  { name: "Beige", r: 201, g: 178, b: 142 },
  { name: "Tan", r: 172, g: 134, b: 91 },
  { name: "Brown", r: 111, g: 76, b: 48 },
  { name: "Navy", r: 24, g: 40, b: 78 },
  { name: "Blue", r: 45, g: 101, b: 190 },
  { name: "Cyan", r: 34, g: 174, b: 190 },
  { name: "Teal", r: 24, g: 122, b: 116 },
  { name: "Green", r: 42, g: 126, b: 74 },
  { name: "Olive", r: 106, g: 112, b: 56 },
  { name: "Red", r: 190, g: 44, b: 52 },
  { name: "Burgundy", r: 112, g: 28, b: 48 },
  { name: "Pink", r: 228, g: 137, b: 167 },
  { name: "Rose", r: 192, g: 92, b: 110 },
  { name: "Purple", r: 120, g: 67, b: 171 },
  { name: "Violet", r: 143, g: 104, b: 206 },
  { name: "Orange", r: 226, g: 116, b: 44 },
  { name: "Gold", r: 194, g: 154, b: 74 },
  { name: "Yellow", r: 226, g: 194, b: 62 },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexOf(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function luminanceOf(r: number, g: number, b: number) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function saturationOf(r: number, g: number, b: number) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const lightness = (max + min) / 2;
  if (max === min) return 0;
  return lightness > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The image could not be read."));
    image.src = url;
  });
}

/**
 * On-device image analysis. Nothing leaves the browser unless a remote visual
 * provider is explicitly configured.
 */
export async function analyzeImage(file: File): Promise<VisualAnalysis> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file to search by sight.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("That image is larger than 12 MB. Try a smaller file.");
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const size = 40;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Image analysis is unavailable in this browser.");
    context.drawImage(image, 0, 0, size, size);
    const { data } = context.getImageData(0, 0, size, size);

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    let saturation = 0;
    const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3];
      if (alpha < 40) continue;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      r += red;
      g += green;
      b += blue;
      saturation += saturationOf(red, green, blue);
      count += 1;

      const key = `${red >> 5}-${green >> 5}-${blue >> 5}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.r += red;
        bucket.g += green;
        bucket.b += blue;
        bucket.count += 1;
      } else {
        buckets.set(key, { r: red, g: green, b: blue, count: 1 });
      }
    }

    if (!count) throw new Error("The image appears to be empty.");
    const average = { r: r / count, g: g / count, b: b / count };
    const palette = [...buckets.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((bucket) => ({
        r: bucket.r / bucket.count,
        g: bucket.g / bucket.count,
        b: bucket.b / bucket.count,
        weight: bucket.count / count,
      }));

    return {
      average,
      hex: hexOf(average.r, average.g, average.b),
      luminance: luminanceOf(average.r, average.g, average.b),
      saturation: saturation / count,
      palette,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function anchorFor(colorName: string) {
  const normalized = colorName.toLowerCase().replace(/[^a-z]/g, "");
  return COLOR_ANCHORS.find((anchor) => anchor.name.toLowerCase() === normalized);
}

function colorSimilarity(colors: string[], analysis: VisualAnalysis) {
  const known = colors
    .map(anchorFor)
    .filter((color): color is (typeof COLOR_ANCHORS)[number] => Boolean(color));
  if (!known.length) return { similarity: 0.32, name: null as string | null };

  let best = { similarity: 0, name: known[0].name, distance: 441 };
  for (const color of known) {
    for (const sample of analysis.palette) {
      const distance = Math.sqrt(
        (color.r - sample.r) ** 2 + (color.g - sample.g) ** 2 + (color.b - sample.b) ** 2,
      );
      const similarity = 1 - clamp(distance / 441, 0, 1);
      if (similarity > best.similarity) {
        best = { similarity, name: color.name, distance };
      }
    }
  }
  return { similarity: best.similarity, name: best.name };
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

const localProvider: VisualSearchProvider = {
  id: "local-palette",
  label: "On-device palette match",
  remote: false,
  async search({ file, analysis, candidates }) {
    const fileTokens = tokenize(file.name);
    return candidates
      .map((candidate) => {
        const color = colorSimilarity(candidate.colors, analysis);
        const candidateText = tokenize(
          `${candidate.name} ${candidate.brandName} ${candidate.categoryName} ${candidate.subCategoryName} ${candidate.colors.join(" ")}`,
        );
        const nameHits = fileTokens.filter((token) => candidateText.includes(token)).length;
        const nameScore = clamp(nameHits * 0.16, 0, 0.34);
        const catalogueScore =
          clamp(candidate.rating / 5, 0, 1) * 0.06 +
          clamp(candidate.reviewCount / 300, 0, 1) * 0.04;
        const confidence = Math.round(
          clamp(48 + color.similarity * 34 + nameScore * 100 + catalogueScore * 100, 55, 97),
        );
        const reason = nameScore > 0
          ? "Name and palette match"
          : color.name
            ? `${color.name} palette match`
            : "Catalogue affinity";
        return { ...candidate, confidence, reason };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6);
  },
};

type RemoteResult = {
  matches?: { id?: string; confidence?: number; reason?: string }[];
};

const remoteProvider: VisualSearchProvider | null = process.env
  .NEXT_PUBLIC_MECO_VISUAL_SEARCH_URL
  ? {
      id: "remote-vision",
      label: "MeCart Vision",
      remote: true,
      async search({ file, analysis, candidates }) {
        const form = new FormData();
        form.append("image", file);
        form.append(
          "signals",
          JSON.stringify({
            palette: analysis.palette,
            luminance: analysis.luminance,
            saturation: analysis.saturation,
            candidates: candidates.map(({ id, name, colors, categoryName }) => ({
              id,
              name,
              colors,
              categoryName,
            })),
          }),
        );
        const response = await fetch(process.env.NEXT_PUBLIC_MECO_VISUAL_SEARCH_URL as string, {
          method: "POST",
          body: form,
        });
        if (!response.ok) throw new Error("The vision service is unavailable.");
        const payload = (await response.json()) as RemoteResult;
        const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
        return (payload.matches ?? [])
          .map((match) => {
            const candidate = match.id ? byId.get(match.id) : undefined;
            if (!candidate) return null;
            return {
              ...candidate,
              confidence: Math.round(clamp(match.confidence ?? 80, 55, 99)),
              reason: match.reason?.slice(0, 80) || "Vision match",
            };
          })
          .filter((match): match is VisualMatch => Boolean(match))
          .slice(0, 6);
      },
    }
  : null;

export function getVisualSearchProvider(): VisualSearchProvider {
  return remoteProvider ?? localProvider;
}

export function visualSearchProviderLabel() {
  return getVisualSearchProvider().label;
}

export function visualSearchHasRemoteModel() {
  return Boolean(remoteProvider);
}

/**
 * Runs the configured provider and falls back to the local palette matcher if
 * the external service is down. The fallback is explicit in the UI.
 */
export async function searchVisually(file: File, candidates: VisualCandidate[]) {
  const analysis = await analyzeImage(file);
  const provider = getVisualSearchProvider();
  try {
    const matches = await provider.search({ file, analysis, candidates });
    if (matches.length) {
      return { analysis, matches, provider: provider.label, fellBack: false };
    }
  } catch {
    // Fall through to the graceful on-device fallback.
  }
  const matches = await localProvider.search({ file, analysis, candidates });
  return {
    analysis,
    matches,
    provider: localProvider.label,
    fellBack: provider.remote,
  };
}
