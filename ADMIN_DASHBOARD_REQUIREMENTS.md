# Admin Dashboard Requirements

## Overview
The admin dashboard should display participant information including names and voter card numbers for participants who have completed challenges.

## Database Access

### Table: `leaderboard_entries`

**Key Columns to Display:**
```sql
- display_name          -- Participant's display name
- voters_card_number    -- Voter's card number (only for participants)
- score                 -- Quiz score (0-1000)
- correct_count         -- Number of correct answers (0-10)
- completion_seconds    -- Time taken to complete
- completed_at          -- Timestamp of completion
- monument_slug         -- Which monument (tinubu or sanwo-olu)
```

## Sample Query for Admin Dashboard

### Get all participant submissions with voter cards:
```sql
SELECT 
  display_name,
  voters_card_number,
  monument_slug,
  score,
  correct_count,
  completion_seconds,
  completed_at
FROM public.leaderboard_entries
WHERE voters_card_number IS NOT NULL
ORDER BY completed_at DESC;
```

### Get participants by monument:
```sql
SELECT 
  display_name,
  voters_card_number,
  score,
  correct_count,
  completed_at
FROM public.leaderboard_entries
WHERE monument_slug = 'sanwo-olu'  -- or 'tinubu'
  AND voters_card_number IS NOT NULL
ORDER BY completed_at DESC;
```

### Get participant statistics:
```sql
SELECT 
  monument_slug,
  COUNT(*) as total_participants,
  AVG(score) as average_score,
  MAX(score) as highest_score
FROM public.leaderboard_entries
WHERE voters_card_number IS NOT NULL
GROUP BY monument_slug;
```

## Dashboard UI Suggestions

### Participants Table View
| Display Name | Voter Card Number | Monument | Score | Correct | Time | Completed At |
|--------------|-------------------|----------|-------|---------|------|--------------|
| @Adaeze_K | 90F5B4C39A987654321 | Sanwo-Olu | 800 | 8/10 | 5m 23s | Nov 3, 2026 |
| @Chidi_O | 90F5B4C39B123456789 | Tinubu | 900 | 9/10 | 4m 12s | Nov 3, 2026 |

### Filters
- Filter by monument (Sanwo-Olu / Tinubu / All)
- Filter by date range
- Filter by score range
- Search by display name or voter card number

### Export Options
- CSV export of participant data
- PDF report generation
- Excel export with formatting

## Distinguishing Participants from Organizers

Participants will have:
- ✅ Voter card number (not null)
- ✅ User role = 'participant' (from players table)

Organizers will have:
- ❌ No voter card number (null)
- ✅ User role = 'organizer' (from players table)

### Query to get only participants:
```sql
SELECT 
  le.display_name,
  le.voters_card_number,
  le.monument_slug,
  le.score,
  le.completed_at,
  p.user_role
FROM public.leaderboard_entries le
JOIN public.players p ON le.player_id = p.id
WHERE p.user_role = 'participant'
  AND le.voters_card_number IS NOT NULL
ORDER BY le.completed_at DESC;
```

## API Endpoint Suggestion

Create a new admin API endpoint: `/api/admin/participants`

**Authentication Required**: Admin-only access

**Response Format:**
```json
{
  "participants": [
    {
      "displayName": "Adaeze_K",
      "votersCardNumber": "90F5B4C39A987654321",
      "monumentSlug": "sanwo-olu",
      "monumentName": "Sanwo-Olu Challenge",
      "score": 800,
      "correctCount": 8,
      "totalQuestions": 10,
      "completionSeconds": 323,
      "completedAt": "2026-11-03T14:30:00Z",
      "formattedTime": "5m 23s"
    }
  ],
  "statistics": {
    "totalParticipants": 150,
    "averageScore": 750,
    "sanwoOluParticipants": 80,
    "tinubuParticipants": 70
  }
}
```

## Security Considerations

1. **Voter Card Privacy**: 
   - Only show full voter card numbers to authenticated admins
   - Consider masking in non-admin views (e.g., show only last 4 digits)

2. **Access Control**:
   - Implement admin authentication
   - Use Row Level Security (RLS) policies in Supabase
   - Log all admin access to participant data

3. **Data Export**:
   - Audit log for all exports
   - Limit export frequency
   - Watermark exported documents

## Sample RLS Policy (Supabase)

```sql
-- Allow admins to view all participant data
CREATE POLICY "Admin read all participant data"
ON public.leaderboard_entries
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Regular users can only see their own data
CREATE POLICY "Users read own data"
ON public.leaderboard_entries
FOR SELECT
TO authenticated
USING (
  player_id = auth.uid()
);
```

## Dashboard Metrics to Track

1. **Participation Rate**
   - Total participants registered
   - Participants who completed at least one monument
   - Completion rate by monument

2. **Engagement**
   - Average time spent per monument
   - Average score per monument
   - Retry rate (participants attempting multiple times)

3. **Geographic Data** (if voter cards include region)
   - Participant distribution by local government area
   - Most engaged regions

4. **Campaign Effectiveness**
   - Scorecard download rate
   - Share rate
   - Countdown engagement

## Next Steps

1. Build admin authentication system
2. Create `/api/admin/participants` endpoint
3. Design admin dashboard UI
4. Implement data export features
5. Set up analytics and reporting
6. Add real-time participant tracking
