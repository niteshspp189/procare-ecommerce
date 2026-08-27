import { sdk } from "@lib/config"

export interface CMSBanner {
  id: string
  title: string
  type: string
  desktop_image_url: string
  mobile_image_url?: string | null
  link_url: string
  alt_text?: string | null
  is_active: boolean
  display_order: number
}

export const DEFAULT_HERO_BANNER: CMSBanner = {
  id: "default-hero",
  title: "Shop Pro Care Products",
  type: "hero",
  desktop_image_url: "/images/landing-page-images/hero-banner-desktop.jpg",
  mobile_image_url: "/images/landing-page-images/hero-banner-mobile.jpg",
  link_url: "/shop",
  alt_text: "Shop Pro Care Shoe Care Products",
  is_active: true,
  display_order: 0,
}

export const getBanners = async (type: string = "hero"): Promise<CMSBanner[]> => {
  return sdk.client
    .fetch<{ success: boolean; banners: CMSBanner[] }>(`/store/custom/banners?type=${type}`, {
      method: "GET",
      next: {
        revalidate: 60,
        tags: ["banners"],
      },
    })
    .then((res) => {
      if (res && res.success && Array.isArray(res.banners) && res.banners.length > 0) {
        return res.banners
      }
      return [DEFAULT_HERO_BANNER]
    })
    .catch(() => {
      return [DEFAULT_HERO_BANNER]
    })
}
