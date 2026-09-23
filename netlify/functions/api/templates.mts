// Starting points for new trips. The sample is a full demo the agent can edit or show clients.

export function blankTrip() {
  return {
    title: "טיול חדש",
    clientName: "",
    travelers: "",
    startDate: "",
    endDate: "",
    intro: "",
    agentNotes: "",
    stops: [],
    flightGroups: [],
    checklist: [
      { id: "passports", title: "דרכונים בתוקף", note: "לפחות 6 חודשים אחרי החזרה", due: "" },
      { id: "insurance", title: "ביטוח נסיעות", note: "", due: "" },
    ],
    goodToKnow: [],
    items: [],
    vouchers: [],
  };
}

const seg = (id: string, leg: string, airline: string, flightNumber: string, from: string, fromCity: string, fromTerminal: string,
  departDate: string, departTime: string, to: string, toCity: string, toTerminal: string, arriveDate: string, arriveTime: string) => ({
  id, leg, airline, flightNumber, from, fromCity, fromTerminal, departDate, departTime, to, toCity, toTerminal, arriveDate, arriveTime,
});

const h = (id: string, name: string, stars: number, description: string, tags: string[], color: string, priceNote = "") => ({
  id, name, stars, description, tags, color, priceNote, link: "", imageUrl: "",
});

export function sampleTrip() {
  return {
    title: "סיציליה והאיים האאוליים",
    clientName: "משפחת מזרחי",
    travelers: "2 מבוגרים, 2 ילדים",
    startDate: "2027-06-12",
    endDate: "2027-06-22",
    intro: "המסלול סגור: טאורמינה, ליפארי, סלינה ופלרמו. בכל עצירה בחרתי שלושה מלונות — ההמלצה שלי מסומנת. בחרו מלון אחד בכל עצירה ואשרו, ואני אדאג לכל השאר.",
    agentNotes: "דניאל לא אוכל פירות ים. מעדיפים שני חדרים מקושרים.",
    stops: [
      {
        id: "taormina", city: "טאורמינה", checkIn: "2027-06-12", checkOut: "2027-06-15", pickId: "t1",
        note: "שלושה לילות מעל הים, עם יום אחד באתנה.",
        hotels: [
          h("t1", "מלון בוטיק בעיר העתיקה", 4, "חמש דקות הליכה מהקורסו. חדרים מקושרים ומרפסת גג עם נוף לים.", ["נוף לים", "ארוחת בוקר", "הכול ברגל"], "#C8923A"),
          h("t2", "מלון משפחתי עם בריכה", 3, "קצת מחוץ למרכז, עם בריכה גדולה וחניה. שאטל לעיר כל חצי שעה.", ["בריכה", "חניה", "שקט"], "#D9B77A", "הכי משתלם"),
          h("t3", "מלון יוקרה על הצוק", 5, "נוף פתוח למפרץ, ספא ושאטל פרטי לחוף איזולה בלה.", ["ספא", "נוף למפרץ", "שאטל לחוף"], "#8E5A2E", "תוספת משמעותית"),
        ],
      },
      {
        id: "lipari", city: "ליפארי", checkIn: "2027-06-15", checkOut: "2027-06-18", pickId: "l1",
        note: "האי הגדול, עם מעבורות לכל שאר האיים.",
        hotels: [
          h("l1", "מלון הנמל", 4, "שתי דקות מהמעבורות, עם בריכה ומסעדות בהליכה.", ["ליד המעבורות", "בריכה", "ארוחת בוקר"], "#2E5A5C"),
          h("l2", "בית הארחה בכפר קאנטו", 3, "דירה משפחתית עם מטבחון, צמודה לחוף החלוקים.", ["צמוד לחוף", "מטבחון", "שקט"], "#6E9A9B", "הכי משתלם"),
          h("l3", "מלון בוטיק עם בריכת אינסוף", 5, "על הגבעה, עם נוף לסטרומבולי ולשקיעה.", ["בריכת אינסוף", "ספא", "נוף"], "#1E3F40", "תוספת משמעותית"),
        ],
      },
      {
        id: "salina", city: "סלינה", checkIn: "2027-06-18", checkOut: "2027-06-20", pickId: "s1",
        note: "האי הירוק והשקט. שני לילות של מנוחה.",
        hotels: [
          h("s1", "מלון עם בריכה במאלפה", 4, "בתוך הכפר, עם בריכה ונוף לים. מסעדות ומאפייה בהליכה.", ["בריכה", "נוף לים", "בכפר"], "#6B7248"),
          h("s2", "אגרוטוריזמו בין כרמי צלפים", 3, "ארוחות ביתיות מהגינה. כדאי לשכור רכב קטן על האי.", ["ארוחות ביתיות", "גינה", "צריך רכב"], "#9AA06E", "הכי משתלם"),
          h("s3", "מלון בוטיק על המים", 5, "ירידה פרטית לים ושקיעות מהמרפסת.", ["ירידה לים", "ספא", "שקיעות"], "#474D2E", "תוספת משמעותית"),
        ],
      },
      {
        id: "palermo", city: "פלרמו", checkIn: "2027-06-20", checkOut: "2027-06-22", pickId: "p1",
        note: "שני לילות בעיר לפני הטיסה הביתה: שווקים, אוכל רחוב וקתדרלות.",
        hotels: [
          h("p1", "מלון בפלאצו ליד הקתדרלה", 4, "ארמון משוחזר במרכז העיר העתיקה, עם חצר פנימית שקטה.", ["מרכז העיר", "ארוחת בוקר", "חדרים גדולים"], "#B5502F"),
          h("p2", "דירת נופש ליד שוק בלארו", 3, "שני חדרי שינה ומטבח, קומה שלישית עם מעלית.", ["שני חדרים", "מטבח", "ליד השוק"], "#D08A6C", "הכי משתלם"),
          h("p3", "מלון עם גג ובריכה", 5, "בריכת גג עם נוף לעיר ולהרים, חניה במקום.", ["בריכת גג", "חניה", "נוף"], "#7A3520", "תוספת משמעותית"),
        ],
      },
    ],
    flightGroups: [
      {
        id: "main", title: "הלוך ושוב", pickId: "f1",
        note: "טסים לקטניה וחוזרים מפלרמו, כדי לא לחזור על אותה דרך.",
        options: [
          {
            id: "f1", title: "ישירה, בשעות נוחות", cabin: "תיירים", priceNote: "",
            baggage: "טרולי 8 ק״ג ומזוודה 23 ק״ג לכל נוסע",
            fareNote: "שינוי תאריך בתוספת תשלום. ביטול: החזר מסים בלבד.", note: "",
            segments: [
              seg("f1a", "out", "אל על", "LY 381", "TLV", "תל אביב", "3", "2027-06-12", "06:10", "CTA", "קטניה", "", "2027-06-12", "09:05"),
              seg("f1b", "back", "אל על", "LY 386", "PMO", "פלרמו", "", "2027-06-22", "14:20", "TLV", "תל אביב", "3", "2027-06-22", "18:40"),
            ],
          },
          {
            id: "f2", title: "דרך רומא", cabin: "תיירים", priceNote: "חוסך כ־15%",
            baggage: "טרולי 8 ק״ג ומזוודה 23 ק״ג לכל נוסע",
            fareNote: "שינוי בתוספת תשלום. ללא החזר בביטול.", note: "עצירה קצרה ברומא בכל כיוון.",
            segments: [
              seg("f2a", "out", "ITA Airways", "AZ 809", "TLV", "תל אביב", "3", "2027-06-12", "11:00", "FCO", "רומא", "1", "2027-06-12", "14:05"),
              seg("f2b", "out", "ITA Airways", "AZ 1731", "FCO", "רומא", "1", "2027-06-12", "15:30", "CTA", "קטניה", "", "2027-06-12", "16:45"),
              seg("f2c", "back", "ITA Airways", "AZ 1778", "PMO", "פלרמו", "", "2027-06-22", "12:10", "FCO", "רומא", "1", "2027-06-22", "13:20"),
              seg("f2d", "back", "ITA Airways", "AZ 808", "FCO", "רומא", "3", "2027-06-22", "15:00", "TLV", "תל אביב", "3", "2027-06-22", "19:40"),
            ],
          },
          {
            id: "f3", title: "לואו־קוסט ישירה", cabin: "תיירים", priceNote: "הכי זול",
            baggage: "תיק קטן מתחת למושב. טרולי ומזוודה בתוספת תשלום",
            fareNote: "ללא שינויים וללא החזר.", note: "נחיתה אחרי חצות — אסדר העברה לילית.",
            segments: [
              seg("f3a", "out", "Wizz Air", "W6 2913", "TLV", "תל אביב", "1", "2027-06-12", "22:40", "CTA", "קטניה", "", "2027-06-13", "01:30"),
              seg("f3b", "back", "Wizz Air", "W6 2916", "PMO", "פלרמו", "", "2027-06-22", "23:55", "TLV", "תל אביב", "1", "2027-06-23", "04:10"),
            ],
          },
        ],
      },
    ],
    checklist: [
      { id: "passports", title: "דרכונים בתוקף", note: "איטליה דורשת תוקף של 3 חודשים לפחות אחרי היציאה", due: "2027-03-01" },
      { id: "insurance", title: "ביטוח נסיעות", note: "העלו את הפוליסה לארנק או בקשו ממני הצעה", due: "2027-05-15" },
      { id: "esim", title: "eSIM או חבילת גלישה", note: "במעבורות ובאיים ה־wifi לא יציב", due: "2027-06-05" },
      { id: "euro", title: "מזומן באירו", note: "חלק מהמקומות באיים לא מקבלים כרטיס", due: "2027-06-10" },
      { id: "adapter", title: "מתאם לשקע", note: "סוג F או L", due: "" },
      { id: "offline", title: "לפתוח את הארנק פעם אחת לפני הטיסה", note: "כך השוברים נשמרים גם בלי אינטרנט", due: "2027-06-11" },
    ],
    goodToKnow: [
      { id: "weather", title: "מזג האוויר ביוני", value: "25–30°C", note: "הים חמים מספיק לשחייה" },
      { id: "money", title: "כסף", value: "אירו", note: "כדאי מזומן לאיים" },
      { id: "plugs", title: "שקעים", value: "F · L", note: "230V — להביא מתאם" },
      { id: "emergency", title: "חירום", value: "112", note: "עובד בכל האיחוד האירופי" },
    ],
    items: [
      { id: "i2", date: "2027-06-12", time: "10:30", endTime: "11:30", kind: "transfer", title: "שאטל לטאורמינה", place: "אולם הנכנסים, קטניה", note: "הנהג מחכה עם שלט", mapUrl: "" },
      { id: "i3", date: "2027-06-12", time: "19:30", endTime: "", kind: "tip", title: "ארוחת ערב בקורסו אומברטו", place: "טאורמינה", note: "להזמין שולחן במרפסת לשקיעה", mapUrl: "" },
      { id: "i4", date: "2027-06-13", time: "08:30", endTime: "13:30", kind: "activity", title: "ג׳יפים באתנה ומערות לבה", place: "איסוף מהמלון", note: "נעליים סגורות ושכבה חמה", mapUrl: "" },
      { id: "i5", date: "2027-06-14", time: "10:00", endTime: "12:00", kind: "activity", title: "התיאטרון היווני", place: "טאורמינה", note: "כדאי להגיע מוקדם, נהיה חם", mapUrl: "" },
      { id: "i6", date: "2027-06-15", time: "10:15", endTime: "11:45", kind: "transfer", title: "העברה לנמל מילאצו", place: "לובי המלון", note: "", mapUrl: "" },
      { id: "i7", date: "2027-06-15", time: "13:30", endTime: "14:30", kind: "ferry", title: "רחפת לליפארי", place: "נמל מילאצו", note: "הכרטיס בארנק", mapUrl: "" },
      { id: "i8", date: "2027-06-16", time: "16:30", endTime: "23:30", kind: "activity", title: "שייט לסטרומבולי בשקיעה", place: "רציף מרינה קורטה", note: "לקחת סוודר", mapUrl: "" },
      { id: "i9", date: "2027-06-18", time: "11:00", endTime: "11:30", kind: "ferry", title: "מעבורת לסלינה", place: "נמל ליפארי", note: "", mapUrl: "" },
      { id: "i10", date: "2027-06-19", time: "17:00", endTime: "", kind: "tip", title: "שקיעה במפרץ פולארה", place: "סלינה", note: "", mapUrl: "" },
      { id: "i11", date: "2027-06-20", time: "08:00", endTime: "10:30", kind: "ferry", title: "מעבורת לפלרמו", place: "נמל סלינה", note: "", mapUrl: "" },
      { id: "i12", date: "2027-06-21", time: "10:00", endTime: "13:00", kind: "activity", title: "סיור אוכל רחוב", place: "שוק בלארו", note: "לבוא רעבים", mapUrl: "" },
    ],
    vouchers: [
      { id: "v1", kind: "flight", title: "תל אביב ← קטניה", when: "12 ביוני · 06:10", ref: "K7Q2LM", who: "4 נוסעים", fileId: "", fileName: "", fileType: "" },
      { id: "v2", kind: "ferry", title: "מילאצו ← ליפארי", when: "15 ביוני · 13:30", ref: "LP-44190", who: "4 נוסעים", fileId: "", fileName: "", fileType: "" },
      { id: "v3", kind: "activity", title: "שייט לסטרומבולי", when: "16 ביוני · 16:30", ref: "STR-0616", who: "2 מבוגרים, 2 ילדים", fileId: "", fileName: "", fileType: "" },
      { id: "v4", kind: "flight", title: "פלרמו ← תל אביב", when: "22 ביוני · 14:20", ref: "K7Q2LM", who: "4 נוסעים", fileId: "", fileName: "", fileType: "" },
    ],
  };
}
