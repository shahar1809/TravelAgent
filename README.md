# Travel agent app

A Hebrew (RTL) web app for a travel agent and her clients, running on Netlify.

- **Back office** (`/agent`): trips, hotel options per stop, day-by-day schedule, getting-ready checklist, vouchers.
- **Client app** (the site's main address): travelers enter their trip code once, then choose one hotel per stop, and get the getting-ready checklist, calendar and daily view, and wallet.
- No payments anywhere.

Stack: React + Vite, one Netlify Function (`netlify/functions/api`), Netlify Blobs for storage (trips and uploaded vouchers). No database or outside services.

## Deploy

1. Put this folder in a GitHub repo and import it in Netlify (**Add new project → Import an existing project**). Build settings come from `netlify.toml`.
   Or, with the Netlify CLI: `npm install`, `netlify init`, `netlify deploy --prod`.
2. In **Project configuration → Environment variables**, add:
   - `AGENT_PASSWORD` — the back-office password.
   - `AUTH_SECRET` — any long random string (signs login sessions; changing it logs everyone out).
3. Redeploy, open `https://<your-site>/agent`, log in, and set the agency name and agent name under **הגדרות**.

## Using it

- **טיול חדש** starts an empty trip. **טיול לדוגמה** creates a full Sicily sample (4 stops × 3 hotels, schedule, checklist, vouchers) to edit or demo.
- Edits are saved with the **שמירה** bar at the bottom. Clients see saved changes immediately.
- Every trip gets a 6-digit code. In **פרטים → כניסת הלקוח** the agent can set her own code (6–8 digits), generate a new one, or sign out every device. Changing the code also signs out devices that used the old one.
- **העתקת הודעה ללקוח** copies a ready message with the app address and the code.
- Travelers enter the code once per device; the app remembers it for a year. The exit button in the app's header signs out that device.
- Wrong codes are limited to 8 attempts per 15 minutes per connection.
- **תצוגת לקוח** opens the client app as that trip (a one-day preview session).
- The client's hotel choices and checklist ticks are never overwritten by the agent's saves. **רענון** loads the latest choices.
- After the client confirms hotels, the choice is locked. **פתיחה מחדש לשינויים** unlocks it.
- Vouchers accept PDF or images up to 10MB.
- Check-in / check-out entries on the schedule come automatically from the stops' dates and the chosen hotel.

## Offline

The client app is a PWA. After it's opened once online, the trip, schedule and opened vouchers work without internet (the wallet pre-loads every voucher file). Clients can add it to the home screen.

## Local development

```
npm install
npm run dev
```
The Netlify Vite plugin emulates Functions and Blobs locally. Set `AGENT_PASSWORD` and `AUTH_SECRET` in a local `.env` file.

## Data

- Production data lives in the global Blobs stores `trips` and `files`. Deploy previews and local dev use separate, deploy-scoped stores, so tests never touch real trips.
- Deleting a trip also deletes its uploaded files.

## Font

Titles and numbers use Horev CLM (Culmus project, GPL). The font file and its license are in `public/fonts/`.
