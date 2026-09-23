import { appUrl } from "../api.js";

// Ready-to-send message with the app address and the trip code.
export function inviteText(trip) {
  const hello = trip.clientName ? `שלום ${trip.clientName},` : "שלום,";
  const code = trip.accessCode || "";
  return [
    hello,
    `האפליקציה של הטיול${trip.title ? ` (${trip.title})` : ""} מוכנה:`,
    appUrl(),
    `קוד הטיול שלכם: ${code}`,
    "מכניסים את הקוד פעם אחת. אפשר להוסיף את האפליקציה למסך הבית, והיא עובדת גם בלי אינטרנט.",
  ].join("\n");
}

export const prettyCode = (c = "") => (c.length === 6 ? `${c.slice(0, 3)} ${c.slice(3)}` : c.length === 8 ? `${c.slice(0, 4)} ${c.slice(4)}` : c);
