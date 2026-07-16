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
    // 1. If single variant product (or <= 1 variant), no option selection is needed
    if (product && (!product.variants || product.variants.length <= 1)) {
        return false;
    }
    const vals = option.values || [];
    if (vals.length === 0) return false;

    // 2. Check if ALL values inside this option are dummy values
    const nonDummyVals = vals.filter(v => !isDummyValue(v.value));
    if (nonDummyVals.length === 0) {
        return false;
    }

    // 3. If there's only 1 unique non-dummy value across all option values for this option,
    // selecting this option doesn't change anything (or it's not a real multi-choice option)
    const uniqueVals = new Set(nonDummyVals.map(v => v.value.trim().toLowerCase()));
    if (uniqueVals.size <= 1) {
        return false;
    }

    return true;
};

export const isSimpleProduct = (product: HttpTypes.StoreProduct): boolean => {
    if (!product.variants || product.variants.length <= 1) {
        return true;
    }
    if (product.options && product.options.length > 0) {
        const hasGenuine = product.options.some(opt => isGenuineOption(opt, product));
        if (!hasGenuine) return true;
    }
    return product.options?.length === 1 && product.options[0].values?.length === 1;
};