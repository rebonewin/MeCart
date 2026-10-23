export type AssistantProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  image: string | null;
  brandName: string;
  categoryName: string;
  subCategoryName: string;
  description: string;
  material: string;
  colors: string[];
  sizes: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  bestSeller: boolean;
  newArrival: boolean;
};

export type AssistantCategory = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type AssistantCatalog = {
  products: AssistantProduct[];
  categories: AssistantCategory[];
};

export type AssistantIntent =
  | "greeting"
  | "recommend"
  | "search"
  | "cart"
  | "checkout"
  | "order"
  | "faq"
  | "gift"
  | "contact"
  | "thanks"
  | "smalltalk";

export type AssistantAction = {
  label: string;
  href: string;
};

export type AssistantReply = {
  intent: AssistantIntent;
  text: string;
  products?: AssistantProduct[];
  categories?: AssistantCategory[];
  actions?: AssistantAction[];
  suggestions?: string[];
  orderLookup?: boolean;
  orderNumber?: string;
};

export type AssistantContext = {
  name?: string | null;
  cartCount: number;
  cartSubtotal: number;
  cartItems: { name: string; quantity: number; price: number }[];
  wishlistCount: number;
};

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "looking", "want",
  "need", "some", "something", "please", "show", "find", "about", "into", "your",
  "you", "can", "could", "would", "help", "me", "my", "a", "an", "to", "of", "in",
  "on", "is", "are", "best", "good", "nice", "new",
]);

const FAQS: { keywords: string[]; reply: Omit<AssistantReply, "intent"> }[] = [
  {
    keywords: ["shipping", "delivery", "deliver", "how long", "arrive", "dispatch"],
    reply: {
      text:
        "Tracked delivery is normally 3–5 business days. Every order is inspected in the atelier before MECO collects it, and the exact shipping line is shown in your bag before payment.",
      actions: [
        { label: "View products", href: "/products" },
        { label: "Ask about an order", href: "/orders" },
      ],
      suggestions: ["Track my order", "What is your returns policy?", "Help me choose a gift"],
    },
  },
  {
    keywords: ["return", "refund", "exchange", "send back"],
    reply: {
      text:
        "Returns are accepted within 7 days of delivery and collected from your door at no extra cost. Keep the piece unworn with its tags and provenance card, and I can point you to the order when you're ready.",
      actions: [
        { label: "Open my orders", href: "/orders" },
        { label: "Contact the atelier", href: "/contact" },
      ],
      suggestions: ["How do I start a return?", "Where is my order?", "Show me new arrivals"],
    },
  },
  {
    keywords: ["pay", "payment", "card", "upi", "netbanking", "cash on delivery", "cod"],
    reply: {
      text:
        "Checkout supports credit or debit card, UPI, net banking and cash on delivery. Payments are encrypted end-to-end, and card details are validated before the order is placed.",
      actions: [
        { label: "Open checkout", href: "/checkout" },
        { label: "View my bag", href: "/cart" },
      ],
      suggestions: ["Is my payment secure?", "What delivery options do I have?", "Help me choose a gift"],
    },
  },
  {
    keywords: ["secure", "security", "safe", "authentic", "authenticity", "genuine"],
    reply: {
      text:
        "Every piece is checked by the atelier before dispatch, and provenance and authenticity are verified on each order. Payments are encrypted end-to-end.",
      actions: [
        { label: "Read about the atelier", href: "/about" },
        { label: "Browse the collection", href: "/products" },
      ],
      suggestions: ["What is your returns policy?", "Show me best sellers", "Track my order"],
    },
  },
  {
    keywords: ["size", "fit", "sizing", "measurement", "small", "large"],
    reply: {
      text:
        "Each product page lists the available sizes and the atelier's fit guidance. If you tell me the piece you're considering, I can show it and help you compare the options.",
      actions: [{ label: "Browse products", href: "/products" }],
      suggestions: ["Show me dresses", "Compare two pieces", "What is your returns policy?"],
    },
  },
  {
    keywords: ["coupon", "discount", "promo", "offer", "sale"],
    reply: {
      text:
        "Live reductions are already reflected in the price you see. Valid coupon codes can be applied in the bag; if a code has expired, the atelier team can help.",
      actions: [
        { label: "See live reductions", href: "/#flash-deals" },
        { label: "Open my bag", href: "/cart" },
      ],
      suggestions: ["Show me trending pieces", "What is your returns policy?", "Help me choose a gift"],
    },
  },
  {
    keywords: ["contact", "human", "agent", "support", "email", "help me"],
    reply: {
      text:
        "The atelier's care team is at care@mecart.store. You can also send a note through the contact page — a person, not a bot, will reply.",
      actions: [
        { label: "Contact the atelier", href: "/contact" },
        { label: "Email care@mecart.store", href: "mailto:care@mecart.store" },
      ],
      suggestions: ["Track my order", "What are your delivery times?", "Show me new arrivals"],
    },
  },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function firstName(name?: string | null) {
  const clean = name?.trim();
  if (!clean) return null;
  return clean.split(" ")[0] ?? null;
}

function tokensOf(value: string) {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function productText(product: AssistantProduct) {
  return normalize(
    [
      product.name,
      product.brandName,
      product.categoryName,
      product.subCategoryName,
      product.description,
      product.material,
      ...product.colors,
      ...product.sizes,
    ].join(" "),
  );
}

function priceLimit(message: string) {
  const under = message.match(/(?:under|below|less than|max(?:imum)?|budget(?: of)?)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  const over = message.match(/(?:over|above|more than|from)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  return {
    max: under ? Number(under[1]) : undefined,
    min: over ? Number(over[1]) : undefined,
  };
}

function matchProducts(
  message: string,
  catalog: AssistantCatalog,
  options: { limit?: number; categorySlug?: string } = {},
) {
  const queryTokens = tokensOf(message);
  const normalized = normalize(message);
  const limits = priceLimit(message);
  const categoryHit = catalog.categories.find(
    (category) =>
      normalized.includes(normalize(category.name)) ||
      normalized.includes(normalize(category.slug)),
  );
  const categorySlug = options.categorySlug ?? categoryHit?.slug;

  const scored = catalog.products
    .filter((product) => !limits.max || product.price <= limits.max)
    .filter((product) => !limits.min || product.price >= limits.min)
    .filter(
      (product) =>
        !categorySlug ||
        normalize(product.categoryName).replace(/\s+/g, "-") === normalize(categorySlug) ||
        normalize(product.categoryName) === normalize(categoryHit?.name ?? ""),
    )
    .map((product) => {
      const text = productText(product);
      let score = product.rating * 7 + Math.min(product.reviewCount, 200) * 0.12;
      if (product.bestSeller) score += 4;
      if (product.newArrival) score += 2;
      for (const token of queryTokens) {
        if (text.includes(token)) score += 12;
      }
      if (normalized.includes(normalize(product.name))) score += 30;
      if (normalized.includes(normalize(product.brandName))) score += 18;
      for (const color of product.colors) {
        if (normalized.includes(normalize(color))) score += 10;
      }
      return { product, score };
    })
    .filter((entry) => queryTokens.length === 0 || entry.score > 10)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, options.limit ?? 4).map((entry) => entry.product);
}

function categorySuggestions(catalog: AssistantCatalog, limit = 4) {
  return catalog.categories
    .filter((category) => category.productCount > 0)
    .slice(0, limit);
}

function topProducts(catalog: AssistantCatalog, limit = 4) {
  return catalog.products
    .slice()
    .sort(
      (a, b) =>
        b.rating * 20 + Math.min(b.reviewCount, 200) * 0.25 -
        (a.rating * 20 + Math.min(a.reviewCount, 200) * 0.25),
    )
    .slice(0, limit);
}

export function mecoInitialReply(
  context: AssistantContext,
  catalog: AssistantCatalog | null,
): AssistantReply {
  const name = firstName(context.name);
  const cacheNote = catalog
    ? `The atelier currently has ${catalog.products.length} live pieces across ${categorySuggestions(catalog).length} collections.`
    : "I can help with the bag, checkout, delivery and order questions right away.";

  return {
    intent: "greeting",
    text: `${name ? `Welcome back, ${name}.` : "Welcome to MeCart."} I'm MECO, your atelier companion. ${cacheNote} Tell me what you're looking for, or pick a starting point below.`,
    products: catalog ? topProducts(catalog, 2) : undefined,
    categories: catalog ? categorySuggestions(catalog) : undefined,
    actions: [
      { label: "Browse products", href: "/products" },
      { label: "Track an order", href: "/orders" },
    ],
    suggestions: [
      "Find me a gift",
      "What's trending?",
      "Help with checkout",
      "Track my order",
    ],
  };
}

/**
 * Rule-based assistant engine with provider-agnostic inputs. A future model can
 * replace `answerMeco` and keep the same reply contract and UI.
 */
export function answerMeco(
  message: string,
  context: AssistantContext,
  catalog: AssistantCatalog | null,
): AssistantReply {
  const normalized = normalize(message);
  const products = catalog?.products ?? [];
  const categories = catalog?.categories ?? [];

  if (!normalized) {
    return {
      intent: "smalltalk",
      text: "I'm here. Ask me about a piece, your bag, checkout, delivery or an order.",
      suggestions: ["Find me a gift", "What's trending?", "Track my order"],
    };
  }

  if (/^(hi|hello|hey|yo|good morning|good afternoon|good evening|welcome)\b/.test(normalized)) {
    return {
      intent: "greeting",
      text: `${firstName(context.name) ? `Hello again, ${firstName(context.name)}.` : "Hello."} I can help you find a piece, finish a checkout, understand delivery, or look up an order.`,
      products: catalog ? topProducts(catalog, 3) : undefined,
      categories: catalog ? categorySuggestions(catalog) : undefined,
      suggestions: ["Find me a gift", "What's trending?", "Help with checkout", "Track my order"],
    };
  }

  if (/^(thanks|thank you|thx|appreciate|perfect|great)\b/.test(normalized)) {
    return {
      intent: "thanks",
      text: "A pleasure. I'll be here if you want a second opinion on a piece or need help with the bag.",
      actions: [{ label: "Return to the collection", href: "/products" }],
      suggestions: ["Show me new arrivals", "Track my order", "What is your returns policy?"],
    };
  }

  if (/\b(bye|goodbye|see you|good night)\b/.test(normalized)) {
    return {
      intent: "smalltalk",
      text: "Until next time. MECO will keep an eye on the atelier.",
      suggestions: ["Browse the collection", "Track my order"],
    };
  }

  const orderNumber =
    message.match(/\bORD-\d{8}-\d{6}\b/i)?.[0] ??
    normalized.match(/\b((?:mc|mec|ord)[-_][a-z0-9-]{4,})\b/i)?.[1] ??
    normalized.match(/\b\d{6,}\b/)?.[0];

  if (
    /\b(track|tracking|where is my order|order status|status of my order|order number|my order|orders?)\b/.test(
      normalized,
    ) ||
    (orderNumber && normalized.includes("order"))
  ) {
    if (orderNumber) {
      return {
        intent: "order",
        text: `I can look up ${orderNumber.toUpperCase()} against your signed-in account. One moment while I check the atelier ledger.`,
        orderLookup: true,
        orderNumber,
        actions: [{ label: "All orders", href: "/orders" }],
      };
    }
    return {
      intent: "order",
      text:
        "I can look up an order by its order number, as long as you're signed in to the account that placed it. Enter the number below, or open your order history.",
      orderLookup: true,
      actions: [
        { label: "Open my orders", href: "/orders" },
        { label: "Sign in", href: "/login" },
      ],
      suggestions: ["Track my order", "Help with checkout", "What are your delivery times?"],
    };
  }

  if (/\b(cart|bag|basket|add to bag|checkout|check out|payment|pay)\b/.test(normalized)) {
    if (/\b(checkout|check out|payment|pay)\b/.test(normalized)) {
      if (context.cartCount === 0) {
        return {
          intent: "checkout",
          text:
            "Your bag is empty, so there's nothing to check out yet. Start with a piece you love — I can suggest something if you tell me the occasion.",
          products: catalog ? topProducts(catalog, 3) : undefined,
          actions: [
            { label: "Browse products", href: "/products" },
            { label: "Find a gift", href: "/search?q=gift" },
          ],
          suggestions: ["Find me a gift", "What's trending?", "What delivery options do I have?"],
        };
      }
      return {
        intent: "checkout",
        text: `Your bag has ${context.cartCount} ${context.cartCount === 1 ? "piece" : "pieces"} at $${context.cartSubtotal.toFixed(2)}. At checkout you can review delivery, choose card, UPI, net banking or cash on delivery, and confirm the order.`,
        actions: [
          { label: "Review my bag", href: "/cart" },
          { label: "Continue to checkout", href: "/checkout" },
        ],
        suggestions: ["Is my payment secure?", "What are your delivery times?", "Track my order"],
      };
    }

    if (context.cartCount === 0) {
      return {
        intent: "cart",
        text:
          "Your bag is empty. The fastest way in is a category or a piece — tell me the occasion, budget or colour and I'll narrow the atelier.",
        products: catalog ? topProducts(catalog, 3) : undefined,
        actions: [{ label: "Browse products", href: "/products" }],
        suggestions: ["Find me a gift under $500", "Show me new arrivals", "What's trending?"],
      };
    }

    const summary = context.cartItems
      .slice(0, 3)
      .map((item) => `${item.quantity} × ${item.name}`)
      .join(", ");
    return {
      intent: "cart",
      text: `Your bag holds ${context.cartCount} ${context.cartCount === 1 ? "piece" : "pieces"} — ${summary}${context.cartItems.length > 3 ? "…" : ""}. Subtotal $${context.cartSubtotal.toFixed(2)} before delivery.`,
      actions: [
        { label: "Review my bag", href: "/cart" },
        { label: "Continue to checkout", href: "/checkout" },
      ],
      suggestions: ["Help with checkout", "What is your returns policy?", "Show me a pairing"],
    };
  }

  if (/\b(gift|present|anniversary|birthday|wedding|occasion)\b/.test(normalized)) {
    const candidates = matchProducts(message, catalog ?? { products: [], categories: [] }, {
      limit: 4,
    });
    const picks = candidates.length ? candidates : topProducts(catalog ?? { products: [], categories: [] }, 4);
    return {
      intent: "gift",
      text: picks.length
        ? "A few considered gifts from the live edit. Tell me the budget, the recipient's style or the occasion and I can narrow it further."
        : "I can shape a gift edit as soon as the catalogue is available. In the meantime, the atelier's care team can help at care@mecart.store.",
      products: picks,
      categories: catalog ? categorySuggestions(catalog) : undefined,
      actions: [
        { label: "Browse all gifts", href: "/products" },
        { label: "Contact the atelier", href: "/contact" },
      ],
      suggestions: ["Under $500", "Something for a birthday", "Show me best sellers"],
    };
  }

  const faq = FAQS.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );
  if (faq) {
    return { intent: "faq", ...faq.reply };
  }

  if (/\b(recommend|suggest|looking for|show me|i want|i need|interested|browse|trending|popular|new|best seller)\b/.test(normalized)) {
    const wantsNew = /\b(new|new arrival|new arrivals)\b/.test(normalized);
    const wantsBest = /\b(best|popular|best seller|best sellers)\b/.test(normalized);
    const matches = matchProducts(message, catalog ?? { products: [], categories: [] }, {
      limit: 4,
    });
    let picks = matches;
    if (!picks.length && wantsNew) {
      picks = products.filter((product) => product.newArrival).slice(0, 4);
    }
    if (!picks.length && wantsBest) {
      picks = products.filter((product) => product.bestSeller).slice(0, 4);
    }
    if (!picks.length) picks = topProducts(catalog ?? { products: [], categories: [] }, 4);

    return {
      intent: picks.length ? "recommend" : "search",
      text: picks.length
        ? "Here's the edit I'd bring to you from the live catalogue. You can open a piece, add it to your bag, or ask me to go narrower."
        : "I couldn't reach the catalogue just now. I can still help with the bag, checkout, delivery or an order — or you can browse the full collection.",
      products: picks,
      categories: catalog ? categorySuggestions(catalog) : undefined,
      actions: [{ label: "View the full collection", href: "/products" }],
      suggestions: ["Under $500", "Show me something blue", "What's trending?", "Help with checkout"],
    };
  }

  const matches = matchProducts(message, catalog ?? { products: [], categories: [] }, {
    limit: 4,
  });
  if (matches.length) {
    return {
      intent: "search",
      text: "I found these in the live catalogue. If none are quite right, give me a colour, budget or occasion and I'll refine the edit.",
      products: matches,
      categories: catalog ? categorySuggestions(catalog) : undefined,
      actions: [
        { label: "See all results", href: `/search?q=${encodeURIComponent(message.trim())}` },
      ],
      suggestions: ["Compare these", "Find me a gift", "What's trending?"],
    };
  }

  return {
    intent: "smalltalk",
    text: `I'm not certain I caught that${firstName(context.name) ? `, ${firstName(context.name)}` : ""}. I can help with products and categories, your bag, checkout, delivery and returns, or an order lookup.`,
    categories: categories.length ? categorySuggestions(catalog ?? { products: [], categories: [] }) : undefined,
    products: catalog ? topProducts(catalog, 2) : undefined,
    actions: [
      { label: "Browse products", href: "/products" },
      { label: "Contact the atelier", href: "/contact" },
    ],
    suggestions: ["Find me a gift", "What's trending?", "Help with checkout", "Track my order"],
  };
}
