import { sdk } from "@lib/config"

export const DEFAULT_ANNOUNCEMENTS = [
  "Free Delivery Eligible On Orders Above ₹{threshold}",
  "Rakhi offer: 5% off on all products on purchase of Rs 999, Use Code RAKHI5",
  "Glow this Rakhi: 5% Off on Magic Pedi. Use Code RAKHI5"
]

export const getAnnouncements = async (): Promise<string[]> => {
  return sdk.client
    .fetch<{ announcements: string[] }>(`/store/custom/announcements`, {
      method: "GET",
      next: {
        revalidate: 60,
        tags: ["announcements"],
      },
    })
    .then((res) => {
      if (res && Array.isArray(res.announcements) && res.announcements.length > 0) {
        return res.announcements
      }
      return DEFAULT_ANNOUNCEMENTS
    })
    .catch(() => {
      return DEFAULT_ANNOUNCEMENTS
    })
}
