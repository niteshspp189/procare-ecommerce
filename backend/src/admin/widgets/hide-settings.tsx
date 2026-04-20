import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

const HideSettingsWidget = () => {
    useEffect(() => {
        // Hide specific elements via JS to reliably target their text content
        const interval = setInterval(() => {
            const items = document.querySelectorAll('a, button, span, div');

            items.forEach(item => {
                const text = item.textContent?.trim() || '';
                if (
                    text === 'Developer' ||
                    text === 'Documentation' ||
                    text === 'Changelog' ||
                    text === 'Shortcuts' ||
                    text === 'Publishable API Keys' ||
                    text === 'Secret API Keys' ||
                    text === 'Workflows'
                ) {
                    // Find the closest list item or link container to hide
                    const container = item.closest('li') || item.closest('a') || item.closest('button');
                    if (container && container.style.display !== 'none') {
                        container.style.display = 'none';
                    }

                    // Also hide divider titles (like "Developer" group title)
                    if (text === 'Developer' && item.tagName === 'SPAN') {
                        const parentLi = item.closest('li');
                        if (parentLi) {
                            parentLi.style.display = 'none';
                            // Hide the divider hr before it if it exists
                            const prevSibling = parentLi.previousElementSibling as HTMLElement;
                            if (prevSibling && prevSibling.tagName === 'LI') {
                                prevSibling.style.display = 'none';
                            }
                        }
                    }
                }
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return null;
}

export const config = defineWidgetConfig({
    zone: [
        "settings.details.after",
        "product.list.after",
        "order.list.after",
    ],
})

export default HideSettingsWidget
