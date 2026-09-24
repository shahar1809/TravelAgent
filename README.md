# Travel agent app

A Hebrew (RTL) web app for a travel agent and her clients, running on Netlify.

- **Back office** (`/agent`): trips, flight options, hotel options per stop, day-by-day schedule, getting-ready checklist, vouchers.
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

## Flights

The **טיסות** tab works like hotels:

- A **flight choice** (usually "הלוך ושוב") holds up to 6 **options**. She marks one as her recommendation; the client picks one and confirms, which locks it (**פתיחה מחדש לשינויים** unlocks).
- Each option has a name, cabin, baggage, change/cancellation terms, a price note, and its **flights**: direction (הלוך/חזור), airline, flight number, departure and landing airport, city, terminal, date and time. Typing an airport code fills in the Hebrew city for common airports.
- Connections show the waiting time automatically, and landings after midnight show +1.
- **שכפול** copies an option, which is the fastest way to build alternatives.
- The chosen flight (or her recommendation until the client chooses) appears in the client's daily schedule and calendar export. Flight entries no longer need to be added in the schedule tab.

## Hotel bank

**מאגר מלונות** (in the side menu) keeps the hotels she recommends again and again, in destination folders grouped by country (for example איטליה → סיציליה).

- **Add to the bank:** from the bank page (paste from Booking or fill in by hand), or from any hotel inside a trip with **הוספה למאגר**, which asks for a folder (existing or new) and a location. Pasting a Booking page that is already in the bank updates it instead of adding a duplicate.
- **Use in a trip:** each stop has **בחירה מהמאגר**. It opens the folder matching the stop's city, lists hotels from that city first, and adds several at once. Photos, room types and "show to client" choices come along; the price note starts empty.
- **Copies, not links:** editing a hotel in a trip doesn't change the bank. **עדכון במאגר** on that hotel pushes the edits back.
- Each bank hotel shows how many times clients chose it (counted when a client confirms hotels), and the bank sorts by that.

## Importing hotels from Booking

In **מלונות**, every hotel option has an import box. Booking blocks automated reading, so import runs from her own browser:

- **Once:** open **איך זה עובד?** in the import box and drag the bookmark button to the browser's bookmarks bar.
- **Each hotel:** open the hotel's Booking page (with dates chosen, so the rooms table loads), click the bookmark, come back and paste into the box. It fills the name, stars, description, amenity tags, address, link, 5 general photos and the room types (2 photos each). The price note is never touched.
- **Room types** arrive unticked. Tick **להציג ללקוח** on the ones the client should see. Photos can be swapped from all the photos found on the page.
- **Hebrew text:** add an `ANTHROPIC_API_KEY` environment variable and the description, tags and room names are rewritten in Hebrew (Claude Haiku, about one cent per hotel). Without it, text comes in the page's language.
- Photos are shown from Booking's servers, not copied. They belong to the hotel or Booking; fine for showing clients, not for public marketing.

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
