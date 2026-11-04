# Required Image Assets

## Deputy Governor Photo

You need to add the following image to the `/public/` directory:

### File: `hamzat.jpg`
- **Subject**: Obafemi Hamzat (Lagos State Deputy Governor)
- **Format**: JPEG
- **Recommended size**: 400x400px minimum (square aspect ratio preferred)
- **Usage**: 
  - Displayed on scorecard for both Sanwo-Olu and Tinubu monuments
  - Shows in election campaign section with "Vote for Hamzat" message
  - Includes countdown to 2027 Lagos Gubernatorial Election

### Where to place:
```
/public/
  ├── hamzat.jpg  ← Add this file here
  ├── sanwo-olu.png
  ├── tinubu.png
  └── ...
```

### Fallback:
If the image fails to load, the component will automatically fall back to `/public/placeholder-user.jpg`

### Quick Test:
After adding the image, complete a quiz as a participant and click "Create scorecard" to verify the image displays correctly in the election section.
