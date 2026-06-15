import * as fs from "fs";
import * as path from "path";

const csvBaseToCatalogTitle: Record<string, string> = {
    "PRO GOLD Shoe Cream": "Pro Gold Color Shoe Cream",
    "PRO GOLD Shoe Cream With Applicator": "Pro Gold Color Shoe Cream with Applicator",
    "PRO GOLD Self Shine": "Pro Gold Shine Self Shine",
    "PRO GOLD Instant Shiner": "Pro Gold Shine Instant Shine",
    "PRO GOLD Leather Moisturize": "Pro Gold Care Leather Moisturizer",
    "PRO GOLD Power Sneaker Cleaner": "Pro Gold Clean Power Cleaning Shampoo",
    "PRO GOLD Clean Power Cleaner(Cleaning Shampoo & Mini Brush)": "PRO GOLD Sneaker Cleaning Kit (Shampoo + Mini Brush)",
    "PRO GOLD Clean Sneaker Wipes-Pack of 30": "PRO GOLD Sneaker Wipes – Pack of 30",
    "PRO GOLD SPORTS & SNEAKER CLEANING KIT": "PRO GOLD SPORTS & SNEAKER CLEANING KIT",
    "PRO GOLD Foam Cleaner": "PRO GOLD Foam Cleaner",
    "PRO GOLD Shoe Deo": "PRO GOLD Shoe Deo"
};

function getProductAndVariantName(fullName: string) {
    const cleanName = fullName.replace(/\s+/g, " ").trim();
    if (cleanName.includes(" -")) {
        const parts = cleanName.split(" -");
        const base = parts[0].trim();
        let variant = parts[1].replace(/\s*\d+g(m)?$/i, "").trim();
        if (!variant) variant = "Default";
        return { base, variant };
    }
    return { base: cleanName, variant: "Default" };
}

function processCsv(csvPath: string) {
    console.log(`Processing CSV at: ${csvPath}`);
    if (!fs.existsSync(csvPath)) {
        console.log(`File does not exist: ${csvPath}`);
        return;
    }

    const content = fs.readFileSync(csvPath, "utf-8");
    const lines = content.split(/\r?\n/);
    const outputLines: string[] = [];

    // Line 1: Header/Title
    if (lines[0]) {
        // If it already contains local url, don't double append
        let line = lines[0].trim();
        if (!line.includes(",Local URL")) {
            line = line + ",Local URL";
        }
        outputLines.push(line);
    }

    // Line 2: Columns
    if (lines[1]) {
        let line = lines[1].trim();
        if (!line.includes(",Local URL")) {
            line = line + ",Local URL";
        }
        outputLines.push(line);
    }

    // Line 3 onwards: data
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(",");
        const fullName = parts[2]?.trim() || "";
        const { base } = getProductAndVariantName(fullName);
        const catalogTitle = csvBaseToCatalogTitle[base] || base;
        const handle = catalogTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const localUrl = `http://localhost:9000/products/${handle}`;

        // If it already has the URL column value, replace it
        // The original line has 19 columns (index 0 to 18)
        // If we split by comma and parts length is 20, the last part is the old URL
        if (parts.length >= 20) {
            parts[parts.length - 1] = localUrl;
            outputLines.push(parts.join(","));
        } else {
            outputLines.push(line + `,${localUrl}`);
        }
    }

    fs.writeFileSync(csvPath, outputLines.join("\n") + "\n", "utf-8");
    console.log(`Successfully updated CSV at ${csvPath}`);
}

const backendCsv = path.join(__dirname, "MRP_Online_Product_wise.csv");
const dataCsv = "/mnt/ExtraStorage/Project-Files/session-2026/procare/ecomm/product-data/MRP Online _Product wise.xlsx - Phase 1.csv";

processCsv(backendCsv);
processCsv(dataCsv);
