# Daily JEE Plan Email — Setup (one time, ~5 minutes)

The email system runs in YOUR Google account via Google Apps Script:
- Scheduler: built-in daily trigger at 00:00–01:00 IST
- Sender: your own Gmail (MailApp) — NO SMTP passwords, NO API keys, nothing in the frontend
- Sync: the app pushes your revision/progress snapshot to the script whenever you use it,
  so the email's "Revision due" section matches your real data.

## Steps
1. Open https://script.google.com → **New project**
2. Delete the default code, paste the entire contents of `Code.gs`
3. (Recommended) Project Settings → check "Show appsscript.json in editor",
   then replace its content with the provided `appsscript.json`
   (this sets the project timezone to Asia/Kolkata — required for midnight IST)
4. In the editor toolbar select the function **setup** → press **Run** → authorize
   (Google will warn it's an unverified personal script — Advanced → Go to project)
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Copy the Web app URL (ends in `/exec`)
6. Open JEE Academic OS → **Settings → Daily Email**
   - Paste the URL into **Endpoint**
   - Toggle **ON**
   - Press **SEND TEST EMAIL** → check omkarmarennavaromu@gmail.com

Done. Every midnight IST from 6 Oct 2026 to 24 Jan 2027 you get that day's plan.

## Notes
- Duplicate protection: the script stores `lastDailyEmailDate` and never sends twice.
- Status + last 14 log entries are shown in Settings → Daily Email.
- Apps Script daily triggers fire within the 00:00–01:00 window (Google's guarantee).
- Revision data in the email is as fresh as the last time you opened the app —
  which is always accurate, because revisions only change when you use the app.
- If email fails, it's logged and shown in Settings; the study plan is never affected.
