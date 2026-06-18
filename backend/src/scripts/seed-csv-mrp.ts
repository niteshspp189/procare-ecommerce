import { ExecArgs } from "@medusajs/framework/types";
import {
    ContainerRegistrationKeys,
    Modules,
    ProductStatus,
} from "@medusajs/framework/utils";
import {
    createProductsWorkflow,
    createCollectionsWorkflow,
} from "@medusajs/medusa/core-flows";
import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";

export default async function seedCsvMrp({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const productModuleService = container.resolve(Modules.PRODUCT);
    const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
    const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

    logger.info("🚀 Starting Complete CSV-based Catalog Seeding...");

    // 1. Setup Environment
    const [salesChannel] = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" });
    const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" });
    const shippingProfile = shippingProfiles[0];

    // 2. Resolve Category IDs dynamically by handle
    const catSearch = await query.graph({
        entity: "product_category",
        fields: ["id", "name", "handle"],
    });
    const categoriesMap: Record<string, string> = {};
    for (const cat of catSearch.data) {
        categoriesMap[cat.handle] = cat.id;
    }
    logger.info(`Mapped categories: ${JSON.stringify(categoriesMap)}`);

    // Ensure main categories exist in the map
    const requiredCats = ["shoe-care", "insoles", "foot-care", "accessories"];
    for (const cat of requiredCats) {
        if (!categoriesMap[cat]) {
            logger.error(`Missing required category handle: ${cat}`);
            throw new Error(`Database is missing category: ${cat}`);
        }
    }

    // 3. Ensure Collections Exist
    const collectionNames = ["Featured", "New Arrivals"];
    const collections: any = {};
    const { data: existingCols } = await query.graph({
        entity: "product_collection",
        fields: ["id", "title", "handle"],
        filters: { title: collectionNames }
    });

    for (const title of collectionNames) {
        let col = existingCols.find(c => c.title === title);
        if (!col) {
            const { result } = await createCollectionsWorkflow(container).run({
                input: { collections: [{ title }] }
            });
            col = result[0] as any;
        }
        collections[title] = col;
    }

    // 4. Robust parser for base name and variant name
    function parseProductAndVariant(fullName: string) {
        const name = fullName.replace(/\s+/g, " ").trim();
        const lower = name.toLowerCase();

        // Pro Gold Shoe Cream with Applicator
        if (lower.includes("shoe cream with applicator")) {
            const variant = name.replace(/.*with applicator\s*-\s*/i, "").trim();
            return { base: "Pro Gold Color Shoe Cream with Applicator", variant };
        }
        // Pro Gold Shoe Cream
        if (lower.includes("shoe cream")) {
            const variant = name.replace(/.*shoe cream\s*-\s*/i, "").replace(/\s*45gm/i, "").trim();
            return { base: "Pro Gold Color Shoe Cream", variant };
        }

        // Self Shine & Instant Shine
        if (lower.includes("self-shine") || lower.includes("self shine")) {
            const variant = name.replace(/.*self\s*shine\s*-\s*/i, "").trim();
            return { base: "Pro Gold Shine Self Shine", variant };
        }
        if (lower.includes("instant shiner") || lower.includes("instant shine")) {
            const variant = name.replace(/.*instant\s*shiner?\s*-\s*/i, "").trim();
            return { base: "Pro Gold Shine Instant Shine", variant };
        }

        // Brushes
        if (lower.includes("application brush")) {
            const variant = lower.includes("dark") ? "Dark" : "Light";
            return { base: "Pro Application Brush", variant };
        }
        if (lower.includes("gloss brush")) {
            const variant = lower.includes("dark") ? "Dark" : "Light";
            return { base: "Pro Gloss Brush", variant };
        }
        if (lower.includes("horse hair brush")) {
            const variant = lower.includes("dark") ? "Dark" : "Light";
            return { base: "Pro Horse Hair Brush", variant };
        }
        if (lower.includes("suede brush rubber black")) {
            return { base: "Pro Suede Brush", variant: "Default" };
        }

        // Shoe Trees
        if (lower.includes("premium shoe tree")) {
            const match = name.match(/shoe tree\s*-?\s*(\d+\/\d+)/i);
            const variant = match ? match[1] : "Default";
            return { base: "PRO Premium Shoe Tree", variant };
        }
        if (lower.includes("shoe tree with spiral") || lower.includes("men shoe tree with spiral")) {
            const match = name.match(/spiral\s*(\d+[\/-]\d+)/i);
            const variant = match ? match[1] : "Default";
            return { base: "PRO Accessories Men Shoe Tree With Spiral", variant };
        }

        // Insoles
        if (lower.includes("ease memory foam")) {
            const match = name.match(/size\s*(\d+)/i);
            const variant = match ? `Size ${match[1]}` : "Default";
            return { base: "PRO Insoles Ease Memory Foam", variant };
        }
        if (lower.includes("ease soft comfort")) {
            return { base: "PRO Insoles Ease Soft", variant: "Default" };
        }
        if (lower.includes("gel comfort foot bed")) {
            const variant = lower.includes("large") ? "Large" : "Small";
            return { base: "PRO Comfort Gel Insoles", variant };
        }
        if (lower.includes("gel comfort air walk") || lower.includes("gel comfort airwalk")) {
            const variant = lower.includes("large") ? "Large" : "Small";
            return { base: "PRO Comfort Air Walk Gel Insoles", variant };
        }
        if (lower.includes("gel comfort heel pad")) {
            const variant = lower.includes("large") ? "Large" : "Small";
            return { base: "PRO insoles Gel Comfort Heel Pad", variant };
        }
        if (lower.includes("ease aloe vera")) {
            return { base: "PRO Insoles Ease Aloe Vera", variant: "Default" };
        }
        if (lower.includes("active cricket")) {
            const match = name.match(/size\s*(\d+-\d+)/i);
            const variant = match ? match[1] : "Default";
            return { base: "PRO Insoles Active Cricket", variant };
        }
        if (lower.includes("active cycling")) {
            const match = name.match(/size\s*(\d+-\s*\d+)/i);
            const variant = match ? match[1].replace(" ", "") : "Default";
            return { base: "PRO Insoles Active Cycling", variant };
        }
        if (lower.includes("active running")) {
            const match = name.match(/size\s*(\d+-\s*\d+)/i);
            const variant = match ? match[1].replace(" ", "") : "Default";
            return { base: "PRO Insoles Active Running", variant };
        }
        if (lower.includes("ease heel liner")) {
            return { base: "PRO Insole Ease Heel Liner", variant: "Default" };
        }

        // Essentials
        if (lower.includes("brush & pumice combo")) {
            return { base: "Pro Essentials Brush & Pumice Combo Turqouise", variant: "Default" };
        }
        if (lower.includes("double sided foot file pink")) {
            return { base: "Pro Essentials Double sided Foot File Pink", variant: "Default" };
        }
        if (lower.includes("double sided foot file purple")) {
            return { base: "Pro Essentials Double sided Foot File Purple", variant: "Default" };
        }
        if (lower.includes("dual action foot file")) {
            return { base: "Pro Essentials Dual Action Foot File Turqouise", variant: "Default" };
        }
        if (lower.includes("magic pedi roller pack black")) {
            return { base: "PRO Essentials Magic Pedi Roller Pack Black", variant: "Default" };
        }
        if (lower.includes("magic pedi roller")) {
            return { base: "PRO Essentials Magic Pedi Roller", variant: "Default" };
        }
        if (lower.includes("nail file")) {
            return { base: "Pro Essentials Nail File Turqouise", variant: "Default" };
        }
        if (lower.includes("nail buffer")) {
            return { base: "Pro Essentials Nail Buffer Turqouise", variant: "Default" };
        }
        if (lower.includes("nail clipper")) {
            return { base: "Pro Essentials Nail Clipper Turqouise", variant: "Default" };
        }
        if (lower.includes("smooth feet pumice")) {
            return { base: "Pro Essentials Smooth Feet Pumice Turqouise", variant: "Default" };
        }

        // Others
        if (lower.includes("leather moisturize") || lower.includes("leather moisturizer")) {
            return { base: "Pro Gold Care Leather Moisturizer", variant: "Neutral" };
        }
        if (lower.includes("power sneaker cleaner") || lower.includes("sneaker cleaner")) {
            return { base: "Pro Gold Clean Power Cleaning Shampoo", variant: "Neutral" };
        }
        if (lower.includes("clean power cleaner")) {
            return { base: "PRO GOLD Sneaker Cleaning Kit (Shampoo + Mini Brush)", variant: "Neutral" };
        }
        if (lower.includes("clean sneaker wipes")) {
            return { base: "PRO GOLD Sneaker Wipes – Pack of 30", variant: "Neutral" };
        }
        if (lower.includes("sports & sneaker cleaning kit")) {
            return { base: "PRO GOLD SPORTS & SNEAKER CLEANING KIT", variant: "Default" };
        }
        if (lower.includes("foam cleaner")) {
            return { base: "PRO GOLD Foam Cleaner", variant: "Neutral" };
        }
        if (lower.includes("shoe deo")) {
            return { base: "PRO GOLD Shoe Deo", variant: "Default" };
        }
        if (lower.includes("nubuck 2 in 1") || lower.includes("nubuck 2in1")) {
            return { base: "Pro Suede 2in1", variant: "Default" };
        }
        if (lower.includes("perfect clean gel")) {
            return { base: "Pro Clean Perfect Clean Gel 50ml Neutral", variant: "Default" };
        }
        if (lower.includes("suede n nubuck spray") || lower.includes("renovator spray")) {
            return { base: "PRO Suede and Nubuck Renovator Spray", variant: "Default" };
        }
        if (lower.includes("hydroshield")) {
            return { base: "PRO Hydroshield", variant: "Default" };
        }
        if (lower.includes("color naivy white")) {
            return { base: "Pro Color Naivy White 75ml White", variant: "Default" };
        }
        if (lower.includes("premium sneaker care kit")) {
            return { base: "PRO Premium Sneaker Care Kit", variant: "Default" };
        }
        if (lower.includes("easy care combo pack")) {
            return { base: "PRO Clean Easy Care Combo Pack Neutral", variant: "Default" };
        }

        return { base: name, variant: "Default" };
    }

    // Helper to get dynamic category slugs
    function getCategorySlug(csvCategory: string): string {
        const norm = csvCategory.trim().toLowerCase();
        if (norm.includes("shoecare") || norm.includes("shoe care")) return "shoe-care";
        if (norm.includes("insole")) return "insoles";
        if (norm.includes("accessory") || norm.includes("accessories") || norm.includes("essentials")) return "accessories";
        if (norm.includes("footcare") || norm.includes("foot care")) return "foot-care";
        return "accessories";
    }

    // Helper to determine Option Title and values
    function getOptionTitleAndValues(rows: any[]) {
        const variants = rows.map(r => parseProductAndVariant(r.name).variant);
        const hasMultiple = variants.length > 1;
        
        if (!hasMultiple) {
            return {
                optionTitle: "Variant",
                values: ["Default"]
            };
        }
        
        const isSize = variants.some(v => 
            /\d+/.test(v) || 
            v.toLowerCase() === "large" || 
            v.toLowerCase() === "small" || 
            v === "L" || 
            v === "S" ||
            v.includes("/") ||
            v.includes("-")
        );
        
        if (isSize) {
            return {
                optionTitle: "Size",
                values: variants
            };
        }
        
        return {
            optionTitle: "Color",
            values: variants
        };
    }

    // Dynamic folder names for images
    function getFolderName(baseProductTitle: string): string {
        const title = baseProductTitle.toLowerCase();
        if (title.includes("applicator")) return "Shoe cream with applicator";
        if (title.includes("color shoe cream")) return "Shoe Cream";
        if (title.includes("self shine")) return "Self Shine";
        if (title.includes("instant shine")) return "Instant Shine";
        if (title.includes("leather moisturizer")) return "Leather Moisturize -Neutral";
        if (title.includes("power cleaning shampoo")) return "Power Sneaker Cleaner -Neutral";
        if (title.includes("sneaker cleaning kit")) return "PRO GOLD Clean Power Cleaner(Cleaning Shampoo & Mini Brush) -Neutral";
        if (title.includes("sneaker wipes")) return "PRO GOLD Clean Sneaker Wipes-Pack of 30 -Neutral";
        if (title.includes("foam cleaner")) return "Foam Cleaner -Neutral";
        if (title.includes("shoe deo")) return "Shoe Deo";
        if (title.includes("application brush")) return "Application Brush";
        if (title.includes("gloss brush")) return "Gloss Brush";
        if (title.includes("horse hair brush")) return "Horse hair Brush";
        if (title.includes("suede brush")) return "Suede Brush";
        if (title.includes("premium shoe tree")) return "Shoe Tree";
        if (title.includes("spiral")) return "Shoe Tree";
        if (title.includes("nubuck 2in1") || title.includes("nubuck 2 in 1") || title.includes("suede 2in1") || title.includes("suede 2 in 1")) return "Nubuck 2 in 1 Neutral";
        if (title.includes("perfect clean gel")) return "Perfect Clean Gel 50ml Neutral";
        if (title.includes("suede and nubuck renovator")) return "Suede N Nubuck Spray 180 ml-Neutral";
        if (title.includes("hydroshield")) return "New folder (2)";
        return "";
    }

    // Image path resolver for WebP matches
    function resolveImagePath(csvImgName: string, folderName: string): string | null {
        if (!csvImgName || !csvImgName.trim() || !folderName) return null;
        let clean = csvImgName.trim().replace(/\s+/g, " ");
        const norm = clean.toLowerCase();
        
        if (norm === "pro gold shoe cream -light brown 2") clean = "PRO GOLD  Shoe Cream -Light Brown (2)";
        else if (norm === "pro gold shoe cream -medium brown 2") clean = "PRO GOLD  Shoe Cream -Medium Brown (2)";
        else if (norm === "pro gold shoe cream -dark brown 2") clean = "PRO GOLD  Shoe Cream -Dark Brown  (2)";
        else if (norm === "pro gold shoe cream -tan 2") clean = "PRO GOLD  Shoe Cream -Tan (2)";
        else if (norm === "pro gold shoe cream -mahogany 2") clean = "PRO GOLD  Shoe Cream -Mahogany (2)";
        else if (norm === "pro gold shoe cream -blue 2") clean = "PRO GOLD  Shoe Cream -Blue (2)";
        else if (norm === "pro gold shoe cream -white 2") clean = "PRO GOLD  Shoe Cream -White (2)";
        else if (norm === "pro gold shoe cream -neutral 2") clean = "PRO GOLD  Shoe Cream -Neutral2";
        else if (norm === "pro gold shoe cream -neutral") clean = "PRO GOLD  Shoe Cream -Neutral";
        else if (norm === "pro gold shoe cream -black") clean = "PRO GOLD  Shoe Cream -Black";
        else if (norm === "pro gold shoe cream -black 2" || norm === "pro gold shoe cream -black2") clean = "PRO GOLD  Shoe Cream -Black2";
        else if (norm === "pro gold shoe cream -light brown") clean = "PRO GOLD  Shoe Cream -Light Brown";
        else if (norm === "pro gold shoe cream -medium brown") clean = "PRO GOLD  Shoe Cream -Medium Brown";
        else if (norm === "pro gold shoe cream -dark brown") clean = "PRO GOLD  Shoe Cream -Dark Brown";
        else if (norm === "pro gold shoe cream -tan") clean = "PRO GOLD  Shoe Cream -Tan";
        else if (norm === "pro gold shoe cream -cognac") clean = "PRO GOLD  Shoe Cream -Cognac";
        else if (norm === "pro gold shoe cream -cognac 2" || norm === "pro gold shoe cream -cognac(2)") clean = "PRO GOLD  Shoe Cream -Cognac  (2)";
        else if (norm === "pro gold shoe cream -mahogany") clean = "PRO GOLD  Shoe Cream -Mahogany";
        else if (norm === "pro gold shoe cream -blue") clean = "PRO GOLD  Shoe Cream -Blue";
        else if (norm === "pro gold shoe cream -white") clean = "PRO GOLD  Shoe Cream -White";
        
        else if (norm === "pro gold shoe cream with applicator -neutral 2") clean = "Shoe Cream With Applicator -Neutral (2)";
        else if (norm === "pro gold shoe cream with applicator -black 2") clean = "Shoe Cream With Applicator -Black (2)";
        else if (norm === "pro gold shoe cream with applicator -light brown 2") clean = "Shoe Cream With Applicator -Light Brown (2)";
        else if (norm === "pro gold shoe cream with applicator -neutral") clean = "Shoe Cream With Applicator -Neutral";
        else if (norm === "pro gold shoe cream with applicator -black") clean = "Shoe Cream With Applicator -Black";
        else if (norm === "pro gold shoe cream with applicator -light brown") clean = "Shoe Cream With Applicator -Light Brown";
        
        else if (norm === "pro gold self shine -neutral2") clean = "Self Shine -Neutral  (2)";
        else if (norm === "pro gold self shine -neutral") clean = "Self Shine -Neutral";
        else if (norm === "pro gold self shine -black2") clean = "Self Shine -Black 2";
        else if (norm === "pro gold self shine -black") clean = "Self Shine -Black";
        else if (norm === "pro gold self shine -brown2") clean = "Self Shine -Brown  (2)";
        else if (norm === "pro gold self shine -brown") clean = "Self Shine -Brown";
        
        else if (norm === "pro gold instant shiner -neutral2") clean = "Instant Shiner -Neutral (2)";
        else if (norm === "pro gold instant shiner -neutral") clean = "Instant Shiner -Neutral";
        else if (norm === "pro gold instant shiner -black2") clean = "Instant Shiner -Black (2)";
        else if (norm === "pro gold instant shiner -black") clean = "Instant Shiner -Black";
        else if (norm === "pro gold instant shiner -brown2") clean = "Instant Shiner -Brown (2)";
        else if (norm === "pro gold instant shiner -brown") clean = "Instant Shiner -Brown";
        
        else if (norm === "suede n nubuck spray 180 ml-neutral 1") clean = "Suede N Nubuck Spray 180 ml-Neutral 1";
        else if (norm === "suede n nubuck spray 180 ml-neutral 2") clean = "Suede N Nubuck Spray 180 ml-Neutral 2";
        
        else if (norm === "application brush dark1") clean = "Application Brush Dark (1)";
        else if (norm === "application brush dark2") clean = "Application Brush Dark (2)";
        else if (norm === "application brush light1") clean = "Application Brush Light (1)";
        else if (norm === "application brush light2") clean = "Application Brush Light (2)";
        
        else if (norm === "horse hair brush dark1") clean = "Horse Hair Brush Dark (1)";
        else if (norm === "horse hair brush dark2") clean = "Horse Hair Brush Dark (2)";
        else if (norm === "horse hair brush light1") clean = "Horse Hair Brush Light (1)";
        else if (norm === "horse hair brush light 2" || norm === "horse hair brush light2") clean = "Horse Hair Brush Light (2)";
        
        else if (norm === "gloss brush dark1") clean = "Gloss Brush Dark (1)";
        else if (norm === "gloss brush dark2") clean = "Gloss Brush Dark (2)";
        else if (norm === "gloss brush light1") clean = "Gloss Brush Light (1)";
        else if (norm === "gloss brush light2") clean = "Gloss Brush Light (2)";
        
        else if (norm === "suede brush rubber black1") clean = "Suede Brush Rubber Black (1)";
        else if (norm === "suede brush rubber black2") clean = "Suede Brush Rubber Black (2)";
        
        else if (norm === "premium shoe tree 1") clean = "Premium Shoe Tree (1)";
        else if (norm === "premium shoe tree 2") clean = "Premium Shoe Tree (2)";
        
        else if (norm === "shoe tree with spiral") clean = "Shoe Tree With Spiral";
        else if (norm === "shoe tree with spiral 2") clean = "Shoe Tree With Spiral (2)";
        
        else if (norm === "hydroshield 180 ml-neutral 1") clean = "Hydroshield 180 ml-Neutral (1)";
        else if (norm === "hydroshield 180 ml-neutral 2") clean = "Hydroshield 180 ml-Neutral (2)";
    
        else if (norm === "nubuck 2 in 1 neutral 1") clean = "Nubuck 2 in 1 Neutral (1)";
        else if (norm === "nubuck 2 in 1 neutral2" || norm === "nubuck 2 in 1 neutral 2") clean = "Nubuck 2 in 1 Neutral (2)";
    
        else if (norm === "perfect clean gel 50ml neutral 1") clean = "Perfect Clean Gel 50ml Neutral (1)";
        else if (norm === "perfect clean gel 50ml neutral 2") clean = "Perfect Clean Gel 50ml Neutral (2)";
    
        else if (norm === "leather moisturize -neutral") clean = "Leather Moisturize -Neutral";
        else if (norm === "leather moisturize -neutral 2") clean = "Leather Moisturize -Neutral (2)";
    
        else if (norm === "power sneaker cleaner -neutral") clean = "Power Sneaker Cleaner -Neutral";
        else if (norm === "power sneaker cleaner -neutral 2") clean = "Power Sneaker Cleaner -Neutral (2)";
    
        else if (norm === "pro gold clean power cleaner(cleaning shampoo & mini brush) -neutral (1)" || norm === "pro gold clean power cleaner(cleaning shampoo & mini brush) -neutral") return `/images/products/pro-gold-clean-power-cleaner/1.webp`;
        else if (norm === "pro gold clean power cleaner(cleaning shampoo & mini brush) -neutral (2)" || norm === "pro gold clean power cleaner(cleaning shampoo & mini brush) -neutral2") return `/images/products/pro-gold-clean-power-cleaner/2.webp`;
    
        else if (norm === "pro gold clean sneaker wipes-pack of 30 -neutral") clean = "PRO GOLD Clean Sneaker Wipes-Pack of 30 -Neutral";
        else if (norm === "pro gold clean sneaker wipes-pack of 30 -neutral 2" || norm === "pro gold clean sneaker wipes-pack of 30 -neutral2") clean = "PRO GOLD Clean Sneaker Wipes-Pack of 30 -Neutral 2";
    
        else if (norm === "foam cleaner -neutral") clean = "Foam Cleaner -Neutral";
        else if (norm === "foam cleaner -neutral 2") clean = "Foam Cleaner -Neutral (2)";
    
        else if (norm === "pro gold shoe deo") clean = "Shoe Deo";
        else if (norm === "pro gold shoe deo 2") clean = "Shoe Deo 2";
    
        return `/images/products/${folderName}/${clean}.webp`;
    }

    // Dynamic brand icons/feature badges mapping
    function getProductBadges(baseProductTitle: string): any[] {
        const title = baseProductTitle.toLowerCase();
        
        if (title.includes("shoe cream")) {
            return [
                { iconId: "/images/icons/pro-color-green.png", label: "PRO COLOR" },
                { iconId: "/images/icons/color-refreshing.png", label: "Color Refreshing" },
                { iconId: "/images/icons/contain-high-quality.png", label: "High Quality" },
                { iconId: "/images/icons/europian-experts.png", label: "European Experts" }
            ];
        }
        if (title.includes("self shine") || title.includes("instant shine")) {
            return [
                { iconId: "/images/icons/pro-shine.png", label: "PRO SHINE" },
                { iconId: "/images/icons/color-refreshing.png", label: "Color Refreshing" },
                { iconId: "/images/icons/shine.png", label: "Shine" },
                { iconId: "/images/icons/europian-experts.png", label: "European Experts" }
            ];
        }
        if (title.includes("moisturizer") || title.includes("renovator") || title.includes("hydroshield")) {
            return [
                { iconId: "/images/icons/pro-care.png", label: "PRO CARE" },
                { iconId: "/images/icons/cleaning.png", label: "Cleaning" },
                { iconId: "/images/icons/shine.png", label: "Shine" },
                { iconId: "/images/icons/europian-experts.png", label: "European Experts" }
            ];
        }
        if (title.includes("cleaning shampoo") || title.includes("cleaning kit") || title.includes("wipes") || title.includes("foam cleaner") || title.includes("2in1") || title.includes("2 in 1") || title.includes("clean gel")) {
            return [
                { iconId: "/images/icons/pro-clean.png", label: "PRO CLEAN" },
                { iconId: "/images/icons/cleaning.png", label: "Cleaning" },
                { iconId: "/images/icons/effective-cleaning-agent.png", label: "Effective Clean" },
                { iconId: "/images/icons/europian-experts.png", label: "European Experts" }
            ];
        }
        if (title.includes("shoe deo")) {
            return [
                { iconId: "/images/icons/pro-fresh.png", label: "PRO FRESH" },
                { iconId: "/images/icons/helps-fight-fungi-and-bacteria.png", label: "Fight Fungi" },
                { iconId: "/images/icons/long-lasting-freshness.png", label: "Long Freshness" },
                { iconId: "/images/icons/europian-experts.png", label: "European Experts" }
            ];
        }
        
        return [
            { iconId: "shipping", label: "Free Shipping" },
            { iconId: "return", label: "30 Day Return" },
            { iconId: "eco", label: "Eco Friendly" },
            { iconId: "kit", label: "Complete Kit" }
        ];
    }

    // Helper to read CSV files dynamically
    function readCsv(filePath: string, formatType: "phase1" | "accessory"): any[] {
        logger.info(`Parsing CSV from: ${filePath}`);
        if (!fs.existsSync(filePath)) {
            logger.warn(`⚠️ CSV file not found: ${filePath}`);
            return [];
        }
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split(/\r?\n/);
        const results: any[] = [];
        
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split(",");
            if (parts.length < 5) continue;
            
            const name = parts[2] ? parts[2].trim() : "";
            if (!name || name === "Name Of Product") continue;
            
            let mrp = 0;
            let sellingPrice = 0;
            let category = "";
            let gst = "";
            let size = "";
            let description = "";
            let howToUse = "";
            let image1 = "";
            let image2 = "";
            let image3 = "";
            let image4 = "";
            
            if (formatType === "phase1") {
                mrp = parseFloat(parts[3]) || 0;
                sellingPrice = parseFloat(parts[8]) || 0;
                category = parts[9] ? parts[9].trim() : "";
                gst = parts[10] ? parts[10].trim() : "";
                size = parts[11] ? parts[11].trim() : "";
                description = parts[12] ? parts[12].trim() : "";
                howToUse = parts[13] ? parts[13].trim() : "";
                image1 = parts[15] ? parts[15].trim() : "";
                image2 = parts[16] ? parts[16].trim() : "";
                image3 = parts[17] ? parts[17].trim() : "";
                image4 = parts[18] ? parts[18].trim() : "";
            } else {
                mrp = parseFloat(parts[3]) || 0;
                sellingPrice = parseFloat(parts[4]) || 0;
                category = parts[5] ? parts[5].trim() : "";
                gst = parts[6] ? parts[6].trim() : "";
                size = parts[7] ? parts[7].trim() : "";
                description = parts[8] ? parts[8].trim() : "";
                howToUse = parts[9] ? parts[9].trim() : "";
                image1 = parts[11] ? parts[11].trim() : "";
                image2 = parts[12] ? parts[12].trim() : "";
                image3 = parts[13] ? parts[13].trim() : "";
                image4 = parts[14] ? parts[14].trim() : "";
            }
            
            results.push({
                name,
                mrp,
                sellingPrice: sellingPrice || mrp,
                category,
                gst,
                size,
                description,
                howToUse,
                image1,
                image2,
                image3,
                image4
            });
        }
        return results;
    }

    // 5. Read CSV Sheets
    const scriptsDir = path.join(process.cwd(), "src", "scripts");
    const phase1Rows = readCsv(path.join(scriptsDir, "Phase_1.csv"), "phase1");
    const accessoryRows = readCsv(path.join(scriptsDir, "Accessory_SHCR.csv"), "accessory");
    const pendingRows = readCsv(path.join(scriptsDir, "PENDING.csv"), "accessory");
    
    const allCsvRows = [...phase1Rows, ...accessoryRows, ...pendingRows];
    logger.info(`Loaded a total of ${allCsvRows.length} variant entries from all spreadsheets.`);

    // Group CSV rows by base product name
    const groupedCsvProducts: Record<string, any[]> = {};
    for (const item of allCsvRows) {
        const { base } = parseProductAndVariant(item.name);
        if (!groupedCsvProducts[base]) {
            groupedCsvProducts[base] = [];
        }
        groupedCsvProducts[base].push(item);
    }
    logger.info(`Grouped variants into ${Object.keys(groupedCsvProducts).length} base products.`);

    // Load actual descriptions and metadata from the catalog to preserve rich information
    const catalogPath = path.join(scriptsDir, "PRO_GOLD_Product_Catalog.md");
    logger.info(`Reading rich descriptions/how-to-use from: ${catalogPath}`);
    const catalogContent = fs.readFileSync(catalogPath, "utf-8");
    const catalogSections = catalogContent.split(/\n## /).slice(1);
    
    const catalogData: Record<string, { description: string; how_to_use: string; metadata: any }> = {};
    for (const section of catalogSections) {
        const items = section.split(/\n### /).slice(1);
        for (const item of items) {
            const itemLines = item.split("\n");
            const title = itemLines[0].replace(/^\d+\.\s*/, "").trim();
            
            const extract = (key: string) => {
                const match = item.match(new RegExp(`\\*\\*${key}:\\*\\*\\s*(.*)`));
                return match ? match[1].trim() : "";
            };

            const extractList = (header: string) => {
                const parts = item.split(new RegExp(`#### ${header}`, 'i'));
                if (parts.length < 2) return "";
                const listPart = parts[1].split(/\n#{2,4}|---|#### /)[0].trim();
                return listPart;
            };

            const specKeys = ["Product Type", "Suitable For", "Net Volume", "Key Ingredients", "Formula", "Safety", "Includes", "Net Content", "Material", "Design", "Function", "Fragrance", "Usage", "Bristle Type", "Handle Material", "Color Compatibility", "Features", "Color", "Key Action"];
            const product_specifications: Record<string, string> = {};
            for (const k of specKeys) {
                const val = extract(k);
                if (val) product_specifications[k] = val;
            }

            catalogData[title.toLowerCase()] = {
                description: extract("Product Type") || `Premium ${title}`,
                how_to_use: extractList("How to Use"),
                metadata: {
                    suitable_for: extract("Suitable For"),
                    key_benefits: extractList("Key Benefits"),
                    product_specifications: Object.keys(product_specifications).length > 0 ? product_specifications : undefined,
                }
            };
        }
    }

    // 6. Construct creation inputs for all products
    const productsToCreate: any[] = [];
    const csvVariantsMap: Record<string, { name: string; mrp: number; sellingPrice: number }[]> = {};

    for (const [baseTitle, rows] of Object.entries(groupedCsvProducts)) {
        const catalogInfo = catalogData[baseTitle.toLowerCase()] || { description: `Premium ${baseTitle}. Designed for professional results.`, how_to_use: "", metadata: {} };
        const handle = baseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        
        const firstRow = rows[0];
        const categorySlug = getCategorySlug(firstRow.category);
        const categoryId = categoriesMap[categorySlug] || categoriesMap["accessories"];
        const folderName = getFolderName(baseTitle);

        // Resolve product-level thumbnail and fallback image from the first variant that has one
        let productThumbnail = "/images/polish.jpeg";
        let productImages: { url: string }[] = [{ url: "/images/polish.jpeg" }];
        
        for (const r of rows) {
            const resolvedImg = resolveImagePath(r.image1, folderName);
            if (resolvedImg) {
                productThumbnail = resolvedImg;
                productImages = [{ url: resolvedImg }];
                const resolvedImg2 = resolveImagePath(r.image2, folderName);
                if (resolvedImg2) {
                    productImages.push({ url: resolvedImg2 });
                }
                break;
            }
        }

        // Determine options
        const { optionTitle, values } = getOptionTitleAndValues(rows);
        const options = [{ title: optionTitle, values }];

        // Define variants
        const variants = rows.map((r) => {
            const { variant } = parseProductAndVariant(r.name);
            const variantSku = `PG-${handle}-${variant.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`.substring(0, 50);
            const variantOptions = { [optionTitle]: optionTitle === "Variant" ? "Default" : variant };

            // Resolve WebP image paths for variants
            const img1 = resolveImagePath(r.image1, folderName);
            const img2 = resolveImagePath(r.image2, folderName);
            const img3 = resolveImagePath(r.image3, folderName);
            const img4 = resolveImagePath(r.image4, folderName);

            return {
                title: variant,
                sku: variantSku,
                options: variantOptions,
                manage_inventory: false,
                metadata: {
                    size: r.size,
                    gst: r.gst,
                    image_1: img1 || "",
                    image_2: img2 || "",
                    image_3: img3 || "",
                    image_4: img4 || ""
                },
                prices: [
                    { amount: r.mrp, currency_code: "inr" },
                    { amount: Math.floor(r.mrp / 80) || 1, currency_code: "usd" }
                ]
            };
        });

        // Store prices for the later SQL price list step
        csvVariantsMap[baseTitle.toLowerCase()] = rows.map(r => ({
            name: r.name,
            mrp: r.mrp,
            sellingPrice: r.sellingPrice
        }));

        const productSize = firstRow?.size || "";

        // Combine metadata
        const productMetadata: Record<string, any> = {
            ...catalogInfo.metadata,
            how_to_use: catalogInfo.how_to_use || firstRow.howToUse,
            product_badges: getProductBadges(baseTitle)
        };

        // Add color hex map for Shoe Creams
        if (baseTitle.toLowerCase().includes("shoe cream") || baseTitle.toLowerCase().includes("shine")) {
            productMetadata.color_hex_map = {
                "Neutral": "#e1d4c0", "neutral": "#e1d4c0",
                "Black": "#000000", "black": "#000000",
                "Light Brown": "#b58a5c", "light brown": "#b58a5c",
                "Medium Brown": "#8b5a2b", "medium brown": "#8b5a2b",
                "Dark Brown": "#3d2314", "dark brown": "#3d2314",
                "Tan": "#b67b3e", "tan": "#b67b3e",
                "Cognac": "#9f381d", "cognac": "#9f381d",
                "Mahogany": "#4a150b", "mahogany": "#4a150b",
                "Blue": "#1e3a8a", "blue": "#1e3a8a",
                "White": "#ffffff", "white": "#ffffff",
                "Brown": "#654321", "brown": "#654321"
            };
        }

        productsToCreate.push({
            title: baseTitle,
            handle,
            subtitle: productSize,
            description: catalogInfo.description || firstRow.description || `Premium ${baseTitle}`,
            status: ProductStatus.PUBLISHED,
            images: productImages,
            thumbnail: productThumbnail,
            shipping_profile_id: shippingProfile.id,
            category_ids: [categoryId],
            collection_id: collections["Featured"]?.id,
            metadata: productMetadata,
            options,
            variants
        });
    }

    // 7. Clear database products before seeding using SQL client to avoid orphans
    logger.info("🧹 Clearing existing database products and all related tables...");
    const cleanDbClient = new Client({ connectionString: process.env.DATABASE_URL });
    await cleanDbClient.connect();
    try {
        await cleanDbClient.query(`
            BEGIN;
            DELETE FROM price WHERE price_set_id IN (SELECT price_set_id FROM product_variant_price_set);
            DELETE FROM price_set WHERE id IN (SELECT price_set_id FROM product_variant_price_set);
            DELETE FROM product_variant_price_set;
            DELETE FROM product_variant_option;
            DELETE FROM product_variant_product_image;
            DELETE FROM product_option_value;
            DELETE FROM product_option;
            DELETE FROM product_variant;
            DELETE FROM product_category_product;
            DELETE FROM product_sales_channel;
            DELETE FROM product_shipping_profile;
            DELETE FROM product;
            COMMIT;
        `);
        logger.info("Cleared all product-related database records successfully.");
    } catch (err) {
        logger.error("Error clearing database: " + err);
        throw err;
    } finally {
        await cleanDbClient.end();
    }

    // 8. Create all products using Medusa workflows
    logger.info(`Creating ${productsToCreate.length} products in database...`);
    const { result: createdProducts } = await createProductsWorkflow(container).run({
        input: { products: productsToCreate }
    });

    // 9. Link all created products to sales channel
    const linkService = container.resolve(ContainerRegistrationKeys.LINK);
    const links = createdProducts.map(p => ({
        [Modules.PRODUCT]: { product_id: p.id },
        [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id }
    }));
    await linkService.create(links);
    logger.info("Linked products to Sales Channel.");

    // 10. Update Selling Prices using SQL and a sale price list
    logger.info("💰 Creating Online Sale price list and setting up selling prices...");
    const dbClient = new Client({ connectionString: process.env.DATABASE_URL });
    await dbClient.connect();

    try {
        await dbClient.query(`
            INSERT INTO price_list (id, status, type, title, description, created_at, updated_at)
            VALUES ('pl_online_sale', 'active', 'sale', 'Online Sale', 'Online Selling Prices', NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
        `);

        await dbClient.query("DELETE FROM price WHERE price_list_id = 'pl_online_sale';");

        for (const prod of createdProducts) {
            const baseTitleLower = prod.title.toLowerCase();
            const csvPriceList = csvVariantsMap[baseTitleLower];
            if (!csvPriceList) continue;

            const dbVariants = await productModuleService.listProductVariants({ product_id: prod.id }, { select: ["id", "title"] });
            
            for (let idx = 0; idx < dbVariants.length; idx++) {
                const dbVariant = dbVariants[idx];
                
                // Find matching CSV variant row based on title/color/size
                const csvRow = csvPriceList.find(c => {
                    const csvColor = parseProductAndVariant(c.name).variant;
                    const dbColor = dbVariant.title;
                    return csvColor.toLowerCase() === dbColor.toLowerCase() || dbVariant.title === "Default";
                }) || csvPriceList[idx];

                if (!csvRow) continue;

                // Query price set ID of this variant
                const priceSetRes = await dbClient.query(
                    "SELECT price_set_id FROM product_variant_price_set WHERE variant_id = $1;",
                    [dbVariant.id]
                );

                if (priceSetRes.rows.length > 0) {
                    const priceSetId = priceSetRes.rows[0].price_set_id;
                    const priceId = "price_" + Math.random().toString(36).substring(2, 15);
                    const rawAmount = JSON.stringify({ value: csvRow.sellingPrice.toString(), precision: 20 });

                    await dbClient.query(
                        `INSERT INTO price (id, amount, currency_code, raw_amount, rules_count, price_set_id, price_list_id, created_at, updated_at)
                         VALUES ($1, $2, 'inr', $3, 0, $4, 'pl_online_sale', NOW(), NOW());`,
                        [priceId, csvRow.sellingPrice, rawAmount, priceSetId]
                    );

                    logger.info(`💰 Added Selling Price ${csvRow.sellingPrice} INR for ${prod.title} (${dbVariant.title})`);
                }
            }
        }
    } catch (err) {
        logger.error("❌ Error setting up price lists in database: " + err);
        throw err;
    } finally {
        await dbClient.end();
    }

    logger.info(`✅ Successfully seeded ${createdProducts.length} products and set up custom selling prices!`);
}
