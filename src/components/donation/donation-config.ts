/**
 * Configuration and default constants for the Chameleon Donation / Support system.
 * All values are easily configurable and can be overridden via component props.
 */

export interface DonationConfig {
  /**
   * InstaPay account username / handle displayed to users
   */
  instapayUsername: string

  /**
   * QR Code data payload for InstaPay
   * Can be an InstaPay URI, payment identifier, or mobile payload
   */
  instapayQrData: string

  /**
   * Optional custom deep-link URI for opening InstaPay app directly.
   */
  instapayDeepLink?: string

  /**
   * Path to the official InstaPay QR code image
   */
  instapayQrImage?: string

  /**
   * Key used to persist user banner dismissal in localStorage
   */
  storageKey: string

  /**
   * Duration in days before a dismissed banner can be shown again (0 = never show again)
   */
  snoozeDays: number

  /**
   * Text strings for localization and customization
   */
  copy: {
    banner: {
      headline: string
      supportingText: string
      secondaryText: string
      ctaButton: string
      dismissAriaLabel: string
    }
    bottomSheet: {
      heading: string
      subheading: string
      usernameLabel: string
      copyButton: string
      copiedText: string
      openAppButton: string
      footerThanks: string
      closeAriaLabel: string
      qrScanHint: string
    }
  }
}

export const DEFAULT_DONATION_CONFIG: DonationConfig = {
  instapayUsername: "abdoahmed7690@instapay",
  instapayQrData: "https://ipn.eg/S/abdoahmed7690/instapay/7HYLGD",
  instapayDeepLink: "https://ipn.eg/S/abdoahmed7690/instapay/7HYLGD",
  instapayQrImage: "/images/instapay-qr.jpg",
  storageKey: "chameleon_donation_banner_dismissed_v1",
  snoozeDays: 14,
  copy: {
    banner: {
      headline: "Chameleon بيكبر يوم بعد يوم بفضلكم",
      supportingText:
        "لو Chameleon ساعدك في مذاكرتك أو وفّر عليك وقت في يوم من الأيام، تقدر تساهم بشكل اختياري في تطويره ووصوله لأكبر عدد من الطلاب.",
      secondaryText:
        "دعمك بيساعدنا نكمّل ونطوّر Chameleon ونخليه متاح للطلاب بشكل مجاني.",
      ctaButton: "ادعم Chameleon",
      dismissAriaLabel: "إغلاق الإشعار",
    },
    bottomSheet: {
      heading: "ساهم في نمو Chameleon",
      subheading:
        "لو حابب تدعم المشروع، تقدر تستخدم InstaPay. المساهمة اختيارية بالكامل.",
      usernameLabel: "اسم حساب InstaPay",
      copyButton: "نسخ اسم المستخدم",
      copiedText: "تم النسخ ✓",
      openAppButton: "فتح InstaPay",
      footerThanks: "شكرًا لدعمك ❤️",
      closeAriaLabel: "إغلاق النافذة",
      qrScanHint: "امسح الـ QR Code من تطبيق InstaPay أو الكاميرا",
    },
  },
}
