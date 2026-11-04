# QR Code Scanning Guide

## 🎯 How It Now Works

### **Device 1 (Display Screen):**
1. Shows the portrait (Tinubu or Sanwo-Olu)
2. Shows a **QR code** overlaid on the pulsating hotspot
3. QR code is scannable by any phone camera

### **Device 2 (Phone Scanner):**
1. Open phone camera app
2. Point at the QR code on the pulsating hotspot
3. Phone automatically detects QR code
4. Tap the notification to open the link
5. Success page shows "Scan Successful!"
6. Automatically redirects back to explore page
7. Hotspot is now unlocked and topic is revealed!

---

## 📱 Two Ways to Unlock Hotspots

### **Method 1: QR Code Scan (Recommended)**
- Open your phone camera
- Point at the glowing QR code on the screen
- Tap the link that appears
- Topic unlocks automatically

### **Method 2: Click (Fallback)**
- If QR scan doesn't work
- Simply click the pulsating hotspot
- Topic unlocks after animation

---

## 🔧 Technical Implementation

### **QR Code Generation:**
```
QR Code contains URL: /monuments/{slug}/scan/{hotspotId}
```

### **Scan Flow:**
1. Phone scans QR → Opens `/monuments/tinubu/scan/hotspot-1`
2. Scan page shows success animation
3. Stores scan in localStorage: `scanned_tinubu_hotspot-1 = true`
4. Redirects back to `/monuments/tinubu/explore`
5. Explore page checks localStorage every second
6. Finds the scan flag → Triggers unlock animation
7. Removes the flag from localStorage

### **Auto-Detection:**
The explore page checks localStorage every 1 second for new scans, so even if the user scans while already on the page, it will detect and unlock automatically.

---

## 🎨 Visual Features

### **QR Code Display:**
- White background square
- 120x120px QR code
- Positioned over the pulsating hotspot
- Green/blue border matching monument color
- Shadow for depth

### **Pulsating Effect:**
- Hotspot number pulses behind QR code
- Glowing animation continues
- Draws attention to scannable area

### **Scan Success:**
- Green gradient background
- Large checkmark icon
- "Scan Successful!" message
- 2-second display before redirect

---

## 🚀 Setup Instructions

### **For Display Device (Laptop/Tablet):**
1. Sign in as **Participant**
2. Navigate to monument explore page
3. Keep screen on
4. Position so QR codes are visible

### **For Participant's Phone:**
1. Open native camera app
2. Point at QR code on screen
3. Tap notification when QR detected
4. Wait for success message
5. Phone returns to explore page
6. Read the unlocked topic

---

## 🔍 Troubleshooting

### **QR Code Not Detecting:**
- Make sure camera has permission
- Ensure good lighting
- Hold phone steady
- Try moving closer/farther
- Make sure QR code is in focus

### **Fallback Method:**
If QR scanning fails:
- Click the pulsating hotspot directly
- Works exactly the same way
- No QR scanner needed

### **QR Code Not Showing:**
- Check console for errors
- Verify internet connection (QR generated online)
- The API endpoint used: `https://api.qrserver.com/v1/create-qr-code/`

---

## 🎮 User Experience Flow

### **Discovery Journey:**
```
1. Participant sees mysterious pulsating spot
   ↓
2. Notices QR code overlaid
   ↓
3. Opens phone camera
   ↓
4. Scans QR code
   ↓
5. Phone shows "Scan Successful!"
   ↓
6. Redirects back to exploration
   ↓
7. Story unlocks with animation
   ↓
8. Reads the content
   ↓
9. Clicks "Continue Journey"
   ↓
10. Next hotspot appears
   ↓
Repeat for all 10 hotspots...
```

---

## 🔐 Security & Privacy

### **QR Code Contains:**
- Only the public URL to scan endpoint
- Monument slug (public info)
- Hotspot ID (public info)
- No personal data
- No authentication tokens

### **Scan Storage:**
- Stored in browser localStorage only
- Cleared after unlock
- No server-side tracking
- Private to the device

---

## 🎨 Customization Options

### **Change QR Size:**
Edit in explore page:
```typescript
width: '120px',  // Change size here
height: '120px',
```

### **Change QR Style:**
The API supports parameters:
```
?size=120x120          // Size
&color=168447          // QR color (hex without #)
&bgcolor=ffffff        // Background color
&margin=10             // Margin around QR
```

### **Use Custom QR Generator:**
Replace `api.qrserver.com` with:
- Your own QR API
- Pre-generated QR images
- Dynamic QR generation on your backend

---

## 📊 Analytics Ideas

Track in your analytics:
- Number of QR scans per hotspot
- Time between scans
- Scan failure rate (clicks vs QR scans)
- Device types used for scanning
- Most popular monuments

---

## 🚀 Future Enhancements

### **Potential Improvements:**
1. **Offline QR Codes**: Pre-generate and embed
2. **AR Markers**: Use ARjs for true AR detection
3. **NFC Tags**: Physical tags at real locations
4. **Geolocation**: Require being at actual location
5. **Camera Integration**: Direct camera access in-app
6. **Unique QR Codes**: Different code per participant
7. **Time Limits**: Expire QR codes after time

---

## ✅ Testing Checklist

- [ ] QR code displays on portrait
- [ ] QR code is scannable by phone camera
- [ ] Scan opens correct URL
- [ ] Success page displays
- [ ] Redirects back to explore page
- [ ] Topic unlocks automatically
- [ ] Next hotspot appears
- [ ] Can complete all 10 hotspots
- [ ] Fallback click method works
- [ ] Works on different phone types (iOS/Android)

---

## 🎉 Why This Works

### **Advantages:**
✅ **Real scanning** - uses actual phone camera
✅ **Universal** - works on any phone (iOS/Android)
✅ **No app needed** - just camera app
✅ **Quick** - scan takes 1 second
✅ **Reliable** - QR codes are standard tech
✅ **Fallback** - can click if scan fails
✅ **Adventurous** - mysterious discovery experience

### **Two-Device Experience:**
- Display device shows the "treasure map" (portrait with QR)
- Phone acts as the "scanner" (unlocks secrets)
- Creates engaging, physical interaction
- Perfect for events and installations
- Scalable for multiple participants

---

This creates a **true AR-like scanning experience** without requiring complex AR libraries! 🎯
