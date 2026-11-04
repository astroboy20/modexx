# AR Two-Device Experience Guide

## 🎯 The Correct Participant Flow

### **What I Fixed**
You were absolutely right - I had completely missed the AR two-device concept! Now it's properly implemented.

---

## 📱 How the AR Experience Works

### **Two Devices Required:**

#### **Device 1: Display Screen**
- Shows the **ACTUAL portrait** (Tinubu or Sanwo-Olu photo)
- Shows **ONE pulsating hotspot** at a time
- This is the "scan target" screen
- Can be a tablet, laptop, or large phone

#### **Device 2: Scanner**
- The participant uses their phone camera
- Points at the pulsating hotspot on Device 1
- "Scans" the hotspot location
- Triggers the topic to be revealed

---

## 🎨 Visual Experience

### **For Participants (AR Scanning Mode):**

```
┌─────────────────────────────────────────────────────────────┐
│  Device 1 (Display Screen)                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                       │   │
│  │           [Actual Tinubu/Sanwo-Olu Portrait]        │   │
│  │                                                       │   │
│  │                    ╔═══════╗                         │   │
│  │                    ║   5   ║  ← PULSATING           │   │
│  │                    ║ ⚡ 💫 ⚡║     Only ONE hotspot   │   │
│  │                    ╚═══════╝     visible at a time  │   │
│  │               "Scan Here: The Vision"               │   │
│  │                                                       │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Instructions: Point Device 2 at the pulsating hotspot]   │
└─────────────────────────────────────────────────────────────┘

                              📱
                            Device 2
                          (Scanner Phone)
                      Points camera here ↑
```

### **What Participants See:**

1. **Left Sidebar:**
   - Progress: "3/10 scanned"
   - Current hotspot info
   - "I've Scanned This Hotspot" button
   - Instructions for two-device setup

2. **Right Side (Main Display):**
   - **FULL PORTRAIT IMAGE** (Tinubu.png or Sanwo-Olu.png)
   - **ONE pulsating hotspot** overlaid on the portrait
   - Hotspot pulsates with glow effect
   - Label: "Scan Here: [Hotspot Name]"
   - Previously scanned spots shown faded (completed)

3. **After Scanning:**
   - Topic content is revealed in sidebar
   - "Next Hotspot →" button appears
   - Next hotspot starts pulsating on the portrait

---

## 🔄 Complete Participant Journey

### **Step 1: Setup**
```
Participant arrives with TWO devices:
- Device 1 (Laptop/Tablet): Shows the app at /monuments/tinubu/explore
- Device 2 (Phone): Used as AR "scanner"
```

### **Step 2: First Hotspot**
```
Device 1 shows:
├─ Left: "Hotspot 1: The Crown" instructions
├─ Right: Tinubu portrait with hotspot #1 PULSATING on his forehead
└─ Label: "Scan Here: The Crown"

Participant points Device 2 camera at pulsating spot
Clicks "I've Scanned This Hotspot" button
```

### **Step 3: Topic Revealed**
```
Sidebar shows:
✅ Scanned Successfully!
Topic: [Full story about "The Crown" - his leadership vision]
[Next Hotspot →] button
```

### **Step 4: Next Hotspot**
```
Device 1 now shows:
├─ Hotspot #1: Faded/completed (no longer pulsating)
├─ Hotspot #2: NOW PULSATING (on different part of portrait)
└─ Repeat scanning process
```

### **Step 5: After All 10 Scanned**
```
All hotspots completed ✅
Portrait shows all 10 hotspots in completed state
[Begin the Challenge →] button appears
```

---

## 👨‍💼 Organizer Flow (Setup Mode)

### **For Organizers (Content Review Mode):**

- Shows **ALL hotspots at once** on the portrait
- Click any hotspot to read its content
- NO pulsating animation
- NO scanning requirement
- Can review all content quickly
- Used for setup and testing

---

## 🎯 Key Features Implemented

### ✅ **Participant Mode:**
1. **Real portrait images** - Tinubu.png and Sanwo-Olu.png displayed
2. **One pulsating hotspot** - Only current spot visible and animated
3. **Sequential scanning** - Must scan in order (1 → 2 → 3... → 10)
4. **AR emphasis** - Clear instructions for two-device setup
5. **Visual feedback** - Completed spots shown faded
6. **Progress tracking** - "3/10 scanned" display
7. **Topic revelation** - Content shown after scanning
8. **Dynamic questions** - Different for each attempt
9. **Voter card required** - Before quiz submission

### ✅ **Organizer Mode:**
1. **All hotspots visible** - Full portrait with all markers
2. **Click to explore** - Read any hotspot immediately
3. **No scanning** - Direct content access
4. **Setup/review mode** - For content verification
5. **No voter card** - Not required for organizers

---

## 🎨 Pulsating Animation Details

### **Visual Effect:**
- Hotspot **scales from 1.2x to 1.4x**
- **Glowing shadow** pulses with the scale
- **2-second cycle** for smooth effect
- **Color-coded**:
  - Green glow for Sanwo-Olu (Lagos state color)
  - Blue glow for Tinubu (APC color)

### **Label Animation:**
- "Scan Here: [Name]" label below hotspot
- Fades between 100% and 70% opacity
- Synced with hotspot pulse

---

## 📱 Device Recommendations

### **Device 1 (Display):**
- **Best:** Laptop or tablet (12"+ screen)
- **Good:** Large phone (6"+ screen)
- **Purpose:** Shows the portrait to be scanned
- **Setup:** Open browser to explore page, keep it open

### **Device 2 (Scanner):**
- **Best:** Smartphone with camera
- **Purpose:** AR scanning device
- **Setup:** Camera app or AR app (for future AR integration)
- **Current:** Just clicks "I've Scanned This Hotspot" button

---

## 🔮 Future AR Enhancement

### **Current Implementation:**
- Simulated AR experience
- Button click confirms "scan"
- Topic revealed after confirmation

### **Future with Real AR:**
- Device 2 uses actual camera
- Computer vision detects pulsating hotspot
- Automatic scan detection
- Real-time AR overlay on Device 2
- Camera automatically triggers topic reveal

**Libraries for Future AR:**
- AR.js for WebAR
- Three.js for 3D markers
- MediaPipe for marker detection
- QR codes as scan triggers

---

## 🎓 Setting Up the Experience

### **For Event Organizers:**

1. **Setup Stations:**
   ```
   Each station needs:
   - 1x Display device (tablet/laptop) logged in as participant
   - 1x Phone for scanning (participant brings their own)
   - Good lighting for scanning
   - Clear instructions poster
   ```

2. **Instructions to Display:**
   ```
   🎯 TWO-DEVICE AR EXPERIENCE
   
   Step 1: Use THIS screen to see the pulsating hotspot
   Step 2: Point YOUR PHONE at the pulsating spot
   Step 3: Click "I've Scanned This Hotspot"
   Step 4: Read the revealed topic
   Step 5: Move to next hotspot
   
   Scan all 10 to unlock the quiz!
   ```

3. **Participant Flow:**
   - Participants sign up on Device 2 (their phone)
   - Transfer to Device 1 for display viewing
   - Use Device 2 for "scanning" action
   - Complete quiz on Device 2
   - Enter voter card on Device 2

---

## ✅ Testing Checklist

- [ ] Portrait images (Tinubu.png, Sanwo-Olu.png) load correctly
- [ ] Only ONE hotspot pulsates at a time
- [ ] Pulsating animation is visible and smooth
- [ ] "Scan Here" label appears below hotspot
- [ ] Clicking scan reveals topic in sidebar
- [ ] Next hotspot starts pulsating after current completes
- [ ] Completed hotspots show faded (opacity 0.5)
- [ ] All 10 hotspots can be scanned sequentially
- [ ] "Begin Challenge" appears after all scanned
- [ ] Organizer mode shows all hotspots simultaneously
- [ ] Organizer can click any hotspot to view content

---

## 🚨 Important Notes

1. **Portrait images MUST exist:**
   - `/public/tinubu.png` ← Required
   - `/public/sanwo-olu.png` ← Required

2. **Hotspot coordinates (x, y) MUST be accurate:**
   - Check `lib/data/tinubu.ts` and `lib/data/sanwo-olu.ts`
   - Coordinates are percentages (x: 50%, y: 30%)
   - Position hotspots on meaningful parts of portrait

3. **Two-device experience:**
   - This is NOT a bug - it's intentional design
   - Creates engaging, interactive experience
   - Simulates AR scanning without complex tech

4. **Scaling for events:**
   - Can have multiple station setups
   - Each station serves multiple participants
   - Participants scan in sequence at their own pace

---

This is now correctly implementing the AR two-device participant experience you described! 🎉
