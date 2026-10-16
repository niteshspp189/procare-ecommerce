import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

export function getPgConnection(req: MedusaRequest): any {
  let pgConnection: any = null
  try {
    pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION, { allowUnregistered: true })
  } catch {}
  if (!pgConnection) {
    try {
      pgConnection = req.scope.resolve("__pg_connection__", { allowUnregistered: true })
    } catch {}
  }
  if (!pgConnection) {
    try {
      pgConnection = req.scope.resolve("pg_connection", { allowUnregistered: true })
    } catch {}
  }
  if (!pgConnection) {
    const knex = require("knex")
    pgConnection = knex({
      client: "pg",
      connection: process.env.DATABASE_URL,
    })
  }
  return pgConnection
}

export const DEFAULT_SEED_BLOGS = [
  {
    id: "blog_leather_care_guide",
    slug: "how-to-clean-and-condition-leather-shoes",
    title: "How to Clean and Condition Leather Shoes: The Ultimate 5-Step Guide",
    excerpt: "Discover the European heritage techniques to clean, nourish, and protect your fine leather footwear using premium waxes, creams, and horsehair brushes.",
    category: "Shoe Care",
    featured_image: "/images/landing-page-images/cat-shoecare-new.webp",
    author: "PRO Care Editorial",
    read_time: "5 min read",
    is_published: true,
    display_order: 1,
    content: `## Why Proper Leather Care Matters

Fine leather footwear is an investment in both your appearance and comfort. Unlike synthetic materials, genuine full-grain and top-grain leathers are porous, organic materials that dry out, crease, and lose their luster if neglected.

Regular nourishment with natural carnauba wax, beeswax, and lanolin keeps the leather supple, prevents cracks along the vamp flex zones, and builds a deep, luminous mirror shine that turns heads.

---

### Step 1: Dry Dusting & Laces Removal
Before applying any cleaner or conditioner, always remove shoe laces so you can clean the tongue thoroughly. Take a **100% natural horsehair brush** and brush firmly across the entire upper, seams, and welt line to dislodge surface dust, road grime, and sand grains.

> **Pro Tip:** Never apply cream or polish on dusty shoes—the dust particles will act as sandpaper and scratch your leather finish during buffing!

---

### Step 2: Deep Cleaning & Pore Unclogging
Use a gentle leather cleaner or foam cleanser with a soft microfiber cloth. Apply a small coin-sized drop, and work in gentle circular motions. This step removes old layers of oxidized wax, dirt, and stubborn spots without stripping the leather's natural oils. Allow the leather to dry naturally at room temperature for 10 minutes.

---

### Step 3: Deep Conditioning & Color Restoration
Select a color-matched or neutral **PRO Gold Shoe Cream**. Using a round horsehair applicator brush or a clean cotton chamois cloth, massage the cream evenly into the leather. 
* Pay close attention to the flex points behind the toe cap where creases naturally form.
* Let the cream absorb for 5 to 10 minutes to nourish deep into the pores.

---

### Step 4: High-Gloss Polishing & Waxing
To achieve a weatherproof seal and a rich, glass-like shine:
1. Apply a thin layer of **PRO Self Shine or Wax Polish** across the toe cap and heel counter.
2. Spritz a single droplet of cold water onto the leather.
3. Buff briskly in circular motions with a soft cotton cloth until the friction brings out a brilliant mirror gloss.

---

### Step 5: Sole & Edge Protection
Don't neglect the sole edges (the welt). Black and dark brown leather shoes look sloppy if the sole edges are scuffed and faded. Apply edge dressing or a touch of dark cream along the sole rim, and allow it to dry completely.

Finally, always insert **solid cedar shoe trees** immediately after wearing to absorb foot moisture and preserve the natural shape of your shoes.`,
  },
  {
    id: "blog_white_sneakers_care",
    slug: "complete-sneaker-cleaning-guide-white-sneakers",
    title: "The Complete Sneaker Cleaning Guide: Keeping Whites Crisp & Clean",
    excerpt: "From canvas to rubber midsoles, learn how instant sneaker wipes, foam cleansers, and water-repellent sprays prevent dirt stains and yellowing.",
    category: "Sneaker Care",
    featured_image: "/images/landing-page-images/cat-accessories-new.webp",
    author: "PRO Care Sneaker Lab",
    read_time: "4 min read",
    is_published: true,
    display_order: 2,
    content: `## The Secret to Long-Lasting White Kicks

White sneakers are the undisputed staple of contemporary style. However, city dust, rain splashes, and daily scuffs can turn pristine white soles yellow and grubby in just a few weeks.

With the right care routine, you can keep your sneakers looking fresh out of the box every single day.

---

### 1. On-The-Go Quick Clean with Sneaker Wipes
The golden rule of sneaker maintenance is **immediate stain removal**. The longer dirt or coffee stays on canvas or leather, the deeper it binds to fibers.
* Keep **PRO Sneaker Wipes (Pack of 30)** in your bag or car.
* Use the textured raised dots on the wipe to lift stubborn mud and scuffs from the rubber foxing.
* Use the smooth side to wipe down leather uppers and plastic eyelets.

---

### 2. Deep Foam Washing (Every 2–3 Weeks)
When your sneakers need a complete refresh:
1. Mix a squirt of concentrated shoe foam cleaner with lukewarm water.
2. Dip a medium-bristle nylon brush and scrub the rubber midsoles and outsoles vigorously.
3. For delicate knit or mesh uppers, switch to a soft premium hog-hair brush to prevent fiber fraying.
4. Wipe dry with a microfiber towel—never soak sneakers completely in water, and **never put them in a washing machine**!

---

### 3. Preventing Midsole Yellowing
UV radiation and oxidation cause white rubber midsoles to turn yellow. After cleaning, store your sneakers away from direct sunlight in a dry, ventilated area.

---

### 4. The Magic Shield: Water & Stain Repellent
Before heading out, spray an even coat of **PRO Universal Waterproof Protector** from 20 cm away. This creates an invisible, hydrophobic nano-barrier that makes liquid droplets roll right off without staining!`,
  },
  {
    id: "blog_suede_nubuck_restoration",
    slug: "suede-vs-nubuck-how-to-protect-and-restore",
    title: "Suede vs. Nubuck: How to Protect, Brush, and Waterproof Velvet Leathers",
    excerpt: "Suede and nubuck need special attention. Learn why water is their biggest enemy and how crepe brushes, brass bristles, and renovator sprays keep nap soft and rich.",
    category: "Leather Care",
    featured_image: "/images/landing-page-images/cat-footcare-new.webp",
    author: "PRO Care Craftsmen",
    read_time: "6 min read",
    is_published: true,
    display_order: 3,
    content: `## Understanding Suede vs. Nubuck

Many shoe lovers confuse suede with nubuck:
* **Suede** is crafted from the inner split of the hide, giving it a softer, longer nap and relaxed texture.
* **Nubuck** is made from the outer grain of the hide that has been lightly buffed and sanded. It has a much finer, velvety nap and is generally tougher than suede.

Because both leathers have an open, fuzzy surface (called the nap), traditional shoe creams or waxes must **NEVER** be applied to them, as wax will mat down the fibers and ruin the velvety texture permanently!

---

### Essential Suede Care Tools
To maintain velvet leathers, you need 3 specialized tools:
1. **Crepe Rubber Brush**: The natural sticky rubber pulls out dust, lint, and dried dirt trapped deep between fibers.
2. **Brass Wire / Suede Combo Brush**: Used to lift flattened nap and restore that uniform velvet look.
3. **Suede Eraser Block**: Rubs away localized oil spots, scuffs, and water rings like magic.

---

### The Restoration Routine
1. **Dry Brushing:** Always brush when the shoe is bone dry. Brush in a single direction to align the fibers.
2. **Eraser for Scuffs:** Gently rub the suede eraser over dark lines or water spots until the stain lifts away.
3. **Nap Fluffing:** Use light, brisk strokes with the brass wire brush to fluff up the velvet nap.
4. **Color Refresh:** If the suede looks faded from sun exposure, apply a color-restoring suede conditioner spray to revive deep blacks, rich tans, or olive hues.
5. **Waterproof Barrier:** Finish with a generous layer of PRO Suede & Nubuck Protector Spray to ensure rainy days don't ruin your footwear.`,
  },
]

export async function ensureBlogTableExists(knex: any) {
  const exists = await knex.schema.hasTable("cms_blog_post")
  if (!exists) {
    await knex.schema.createTable("cms_blog_post", (table: any) => {
      table.string("id", 255).primary()
      table.string("slug", 255).unique().notNullable()
      table.string("title", 500).notNullable()
      table.text("excerpt").nullable()
      table.text("content").notNullable()
      table.string("category", 100).defaultTo("General")
      table.text("featured_image").nullable()
      table.string("author", 100).defaultTo("PRO Care Editorial")
      table.string("read_time", 50).defaultTo("4 min read")
      table.boolean("is_published").defaultTo(true)
      table.integer("display_order").defaultTo(0)
      table.timestamp("published_at").defaultTo(knex.fn.now())
      table.timestamp("created_at").defaultTo(knex.fn.now())
      table.timestamp("updated_at").defaultTo(knex.fn.now())
    })
  }

  // Seed default articles if table is empty
  const count = await knex("cms_blog_post").count("id as total").first()
  if (count && Number(count.total) === 0) {
    for (const post of DEFAULT_SEED_BLOGS) {
      await knex("cms_blog_post").insert({
        ...post,
        created_at: new Date(),
        updated_at: new Date(),
      })
    }
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const pgConnection = getPgConnection(req)
    await ensureBlogTableExists(pgConnection)

    const category = (req.query.category as string) || undefined
    let query = pgConnection("cms_blog_post").select("*").orderBy("display_order", "asc").orderBy("created_at", "desc")

    if (category && category !== "all") {
      query = query.where("category", category)
    }

    const posts = await query

    return res.json({
      success: true,
      posts,
      count: posts.length,
    })
  } catch (error: any) {
    console.error("[CMS Blogs GET] Error:", error)
    return res.status(500).json({ success: false, message: error.message, posts: [] })
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const pgConnection = getPgConnection(req)
    await ensureBlogTableExists(pgConnection)

    const {
      title,
      slug,
      excerpt,
      content,
      category = "Shoe Care",
      featured_image,
      author = "PRO Care Editorial",
      read_time = "4 min read",
      is_published = true,
      display_order = 0,
    } = req.body as any

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Article Title and Content are required",
      })
    }

    const cleanSlug = (slug || title)
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")

    const id = `post_${randomUUID().replace(/-/g, "").slice(0, 20)}`
    const newPost = {
      id,
      slug: cleanSlug,
      title: title.trim(),
      excerpt: excerpt ? excerpt.trim() : null,
      content: content.trim(),
      category: category ? category.trim() : "General",
      featured_image: featured_image ? featured_image.trim() : null,
      author: author ? author.trim() : "PRO Care Editorial",
      read_time: read_time ? read_time.trim() : "4 min read",
      is_published: Boolean(is_published),
      display_order: Number(display_order) || 0,
      published_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    }

    await pgConnection("cms_blog_post").insert(newPost)

    return res.json({
      success: true,
      post: newPost,
      message: "Blog post created successfully",
    })
  } catch (error: any) {
    console.error("[CMS Blogs POST] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
