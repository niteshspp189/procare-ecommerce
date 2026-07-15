import { HttpTypes } from "@medusajs/types";

const DUMMY_VALUES = new Set([
    "-", "", "default", "default title", "default option", "default variant", 
    "default size", "one size", "universal", "standard", "none", "n/a", "no size"
]);

export const isDummyValue = (val: string | undefined | null): boolean => {
    if (!val) return true;
    const clean = val.trim().toLowerCase();
    return DUMMY_VALUES.has(clean);
};

export const isGenuineOption = (option: HttpTypes.StoreProductOption, product?: HttpTypes.StoreProduct): boolean => {
    // If single variant product (or <= 1 variant), and option has <= 1 value or dummy value, it's not genuine
    if (product && (!product.variants || product.variants.length <= 1)) {
        return false;
    }
    const vals = option.values || [];
    if (vals.length === 0) return false;

    // Check if ALL values inside this option are dummy values
    const nonDummyVals = vals.filter(v => !isDummyValue(v.value));
    if (nonDummyVals.length === 0) {
        return false;
    }

    // If there's only 1 unique non-dummy value across all option values
    if (new Set(nonDummyVals.map(v => v.value.trim().toLowerCase())).size <= 1) {
        if (product && (!product.variants || product.variants.length <= 1)) {
            return false;
        }
        // If option title is generic or Size and only 1 value total when product <= 1 variant or generic title
        if (vals.length <= 1 && (option.title?.toLowerCase() === "title" || option.title?.toLowerCase() === "default option")) {
            return false;
        }
    }
    return true;
};

export const isSimpleProduct = (product: HttpTypes.StoreProduct): boolean => {
    if (!product.variants || product.variants.length <= 1) {
        return true;
    }
    // Check if there are genuine options across the variants
    if (product.options && product.options.length > 0) {
        const hasGenuine = product.options.some(opt => isGenuineOption(opt, product));
        if (!hasGenuine) return true;
    }
    return product.options?.length === 1 && product.options[0].values?.length === 1;
};