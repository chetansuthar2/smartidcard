# KPGU Logo Images

This folder contains the official KPGU (Drs. Kiran & Pallavi Patel Global University) logo images used in the ID card system.

## Files

- `kpgu-logo.png` - Official KPGU logo (695x649 pixels)
  - Source: https://image-static.collegedunia.com/public/college_data/images/logos/1704691703Logoupdated111536x6491.png
  - Used in: ID card generation, QR code watermarks

## Usage in Code

### Admin Panel (ID Card Generation)
```javascript
// QR Code watermark
const logoUrl = '/images/kpgu-logo.png'

// Top-left corner logo
logoImg.src = '/images/kpgu-logo.png'
```

### How to Update Logo

1. **Replace the image file:**
   ```bash
   # Place your new logo image in this folder
   cp your-new-logo.png smartidcard/public/images/kpgu-logo.png
   ```

2. **Or download from URL:**
   ```bash
   curl -o smartidcard/public/images/kpgu-logo.png "YOUR_LOGO_URL"
   ```

3. **No code changes needed** - the system will automatically use the new image

## Image Requirements

- **Format:** PNG (recommended) or JPG
- **Size:** Minimum 200x200 pixels for good quality
- **Aspect Ratio:** Square or close to square works best
- **Background:** Transparent PNG preferred for better integration

## Locations Used

1. **ID Card Top-Left Corner**
   - Size: 50x50 pixels
   - Background: White circle
   - Purpose: Official branding

2. **QR Code Watermark**
   - Size: 40x40 pixels
   - Opacity: 80%
   - Purpose: Security and branding

## Fallback System

If the logo image fails to load, the system will:
1. Try to load the image
2. If failed, show "KPGU" text as fallback
3. Log error to console for debugging

## File Path Structure

```
smartidcard/
├── public/
│   └── images/
│       ├── kpgu-logo.png     ← Main logo file
│       └── README.md         ← This file
└── app/
    └── admin/
        └── page.tsx          ← Uses logo in ID card generation
```

## Notes

- Logo is served from `/images/kpgu-logo.png` URL path
- Same logo is copied to cardstation app for consistency
- High-quality image ensures good print quality for ID cards
- Local hosting ensures faster loading and offline capability
