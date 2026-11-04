# Participant vs Organizer Flow Comparison

## 🎭 Two Different User Experiences

---

## 👥 PARTICIPANT FLOW (AR Experience)

### 1. Sign Up
```
┌─────────────────────────┐
│  Choose Display Name    │
│  ┌─────────┐ ┌────────┐│
│  │Participant│Organizer││  ← Select PARTICIPANT
│  └─────────┘ └────────┘│
│  [Create Account]       │
└─────────────────────────┘
```

### 2. Explore Monument (Sequential AR Scanning)
```
Step 1: First Hotspot Only
┌─────────────────────────────────┐
│  Hotspot Progress: 0/10         │
│  ────────────────────────────   │
│                                  │
│    ╔════════════════╗            │
│    ║   ⚡ PULSE ⚡   ║ ← Pulsating│
│    ║                ║            │
│    ║  Hotspot 1:    ║            │
│    ║  "The Crown"   ║            │
│    ╚════════════════╝            │
│                                  │
│  Use your device to scan this   │
│  location in AR to reveal topic │
│                                  │
│  [🔍 Scan Location in AR]       │
└─────────────────────────────────┘

Step 2: After Scanning
┌─────────────────────────────────┐
│  ✅ Location Scanned!            │
│                                  │
│  Topic: [Full story content     │
│  about this hotspot revealed    │
│  after scanning...]             │
│                                  │
│  [Next Hotspot →]               │
└─────────────────────────────────┘

Repeat for all 10 hotspots...

Step 3: All Complete
┌─────────────────────────────────┐
│  ✅ All Hotspots Scanned!       │
│                                  │
│  You've explored all 10          │
│  locations. Ready to test        │
│  your knowledge?                 │
│                                  │
│  [▶ Start Challenge]            │
└─────────────────────────────────┘
```

### 3. Take Quiz (Dynamic Questions)
```
┌─────────────────────────────────┐
│  Question 3 of 10               │
│  ────■■■──────────────          │
│                                  │
│  Q: When was Tinubu elected?    │
│                                  │
│  ○ A. 2019                      │
│  ○ B. 2023  ← Different for     │
│  ○ C. 2015     each participant │
│  ○ D. 2027                      │
└─────────────────────────────────┘
```

### 4. Enter Voter Card (Required!)
```
┌─────────────────────────────────┐
│  Enter Voter's Card Number      │
│                                  │
│  This will be shown in admin    │
│  dashboard with your name.      │
│                                  │
│  ┌───────────────────────────┐  │
│  │ 90F5B4C39A987654321       │  │
│  └───────────────────────────┘  │
│                                  │
│  [Submit Challenge]  [Cancel]   │
└─────────────────────────────────┘
```

### 5. View Results + Campaign
```
┌─────────────────────────────────┐
│  Your Score: 800/1,000          │
│  8/10 correct · 5m 23s          │
│                                  │
│  ┌───────────────────────────┐  │
│  │  [Photo: Obafemi Hamzat]  │  │
│  │  Vote for Hamzat          │  │
│  │  2027 Lagos Election      │  │
│  │  ⏱ 125d 14h to election   │  │
│  └───────────────────────────┘  │
│                                  │
│  [📥 Create Scorecard]          │
└─────────────────────────────────┘
```

---

## 🏢 ORGANIZER FLOW (Setup/Admin Experience)

### 1. Sign Up
```
┌─────────────────────────┐
│  Choose Display Name    │
│  ┌─────────┐ ┌────────┐│
│  │Participant│Organizer││  ← Select ORGANIZER
│  └─────────┘ └────────┘│
│  [Create Account]       │
└─────────────────────────┘
```

### 2. Explore Monument (All Hotspots Visible)
```
┌─────────────────────────────────┐
│  [← Back]     9/10 explored     │
├─────────────────────────────────┤
│                                  │
│  Sidebar          Portrait       │
│  ┌──────┐      ┌──────────────┐ │
│  │ 01 ✓ │      │   [Photo]    │ │
│  │ 02 ✓ │      │              │ │
│  │ 03 ✓ │      │   ⑦ ⑧ ⑨    │ │ All hotspots
│  │ 04 ✓ │      │  ④ 🔵 ⑥     │ │ shown at once
│  │ 05   │◄─────┤   ① ② ③     │ │ (No scanning!)
│  │ 06 ✓ │      │              │ │
│  │ 07 ✓ │      │   [Governor] │ │
│  │ 08 ✓ │      └──────────────┘ │
│  │ 09 ✓ │                       │
│  │ 10   │      Click any number │
│  └──────┘      to read chapter  │
│                                  │
│  [Begin Challenge →]            │
└─────────────────────────────────┘
```

### 3. Take Quiz (Same Questions)
```
┌─────────────────────────────────┐
│  Question 3 of 10               │
│  ────■■■──────────────          │
│                                  │
│  Q: When was Tinubu elected?    │
│                                  │
│  ○ A. 2019                      │
│  ○ B. 2023  ← Standard quiz     │
│  ○ C. 2015     (for review)     │
│  ○ D. 2027                      │
└─────────────────────────────────┘
```

### 4. Submit (No Voter Card Required)
```
┌─────────────────────────────────┐
│  Question 10 of 10              │
│  ────■■■■■■■■■■                 │
│                                  │
│  [Submit Challenge →]           │
│       ↓                          │
│  Goes directly to results       │
│  (no voter card prompt)         │
└─────────────────────────────────┘
```

### 5. View Results (Setup View)
```
┌─────────────────────────────────┐
│  Your Score: 900/1,000          │
│  9/10 correct · 4m 12s          │
│                                  │
│  Answer Review:                  │
│  ✅ Q1: Correct (+100)          │
│  ✅ Q2: Correct (+100)          │
│  ❌ Q3: Wrong (0)               │
│  ...                            │
│                                  │
│  [🔄 Replay]  [📊 Leaderboard] │
└─────────────────────────────────┘
```

---

## 🔑 Key Differences Summary

| Feature | Participant | Organizer |
|---------|-------------|-----------|
| **Hotspot Display** | One at a time | All at once |
| **Scanning** | Required AR scanning | No scanning |
| **Topic Access** | After scan only | Immediate access |
| **Quiz Questions** | Random/dynamic | Standard set |
| **Voter Card** | ✅ Required | ❌ Not required |
| **Campaign Content** | ✅ Hamzat + countdown | ✅ Same |
| **Purpose** | Engagement/voting | Setup/testing |

---

## 📊 Database Storage

### Participant Entry
```sql
player_id: abc123
display_name: "Adaeze_K"
user_role: "participant"        ← ROLE
voters_card_number: "90F5..."   ← VOTER CARD
score: 800
```

### Organizer Entry
```sql
player_id: def456
display_name: "Admin_User"
user_role: "organizer"          ← ROLE
voters_card_number: NULL        ← NO CARD
score: 900
```

---

## 🎯 Use Cases

### Participants (Public Users)
- Engage with AR monument experience
- Learn about political figures
- Register voter information
- Compete on leaderboard
- Share campaign messages

### Organizers (Campaign Staff)
- Test the full experience
- Review content accuracy
- Set up questions and hotspots
- Monitor participant data
- Don't need voter registration

---

## 🔄 Flow Diagrams

### Participant Journey
```
Sign Up (Participant)
    ↓
Explore Monument
    ↓
Scan Hotspot 1 → Read Topic → Next
    ↓
Scan Hotspot 2 → Read Topic → Next
    ↓
... (repeat 10x)
    ↓
All Scanned → Start Quiz
    ↓
Answer Dynamic Questions
    ↓
Enter Voter Card ← REQUIRED
    ↓
Submit → Results + Campaign
    ↓
Share Scorecard with Countdown
```

### Organizer Journey
```
Sign Up (Organizer)
    ↓
Explore Monument
    ↓
View All Hotspots at Once
    ↓
Click Any Hotspot → Read All Content
    ↓
Review Complete → Start Quiz
    ↓
Answer Standard Questions
    ↓
Submit Directly (No Voter Card)
    ↓
Results → Setup Complete
```

---

## 💡 Why This Design?

### For Participants:
- **Sequential scanning** = more engagement
- **AR emphasis** = modern, interactive
- **Voter card** = data collection for campaign
- **Dynamic questions** = prevents cheating
- **Campaign integration** = political messaging

### For Organizers:
- **Full visibility** = easier content review
- **No barriers** = quick testing
- **Skip voter card** = not needed for staff
- **Standard questions** = consistent testing

---

This design gives you the best of both worlds:
- Engaging experience for public participants
- Efficient setup/testing for campaign organizers
