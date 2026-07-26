# 🔧 Servis Tracker

**Track your vehicle's oil changes and maintenance — never miss a service again.**

A free, open-source, installable web app (PWA) for tracking engine oil and maintenance schedules for your car and motorcycles. Register your vehicles, log each service, and let the app automatically calculate when the next one is due — based on mileage *and* time, whichever comes first.

Built for personal use (originally for a Proton Persona 1.6, a Yamaha NMAX 155, and a Yamaha Lagenda 115 FI), but fully customizable for any vehicle.

---

## ✨ Features

- **Multi-vehicle dashboard** — track as many cars/motorcycles as you want, each with its own maintenance schedule.
- **Smart oil-change tracking** — pick semi-synthetic or fully-synthetic at each service, and the app auto-calculates the correct next-due mileage for that oil type.
- **Full maintenance coverage** — engine oil, coolant, spark plugs, CVT belt/set, air filter, brake fluid, battery, plus any custom item you want to add (modifications, extra parts, anything).
- **Mileage + time based due dates** — some items are due by km, some by months, some by both. The app flags whichever comes first.
- **Color-coded status** — instantly see what's OK (green), due soon (yellow), or overdue (red) for every vehicle.
- **Access from anywhere** — data lives in the cloud (Firebase), not on a single device or local network. Open it from your phone, laptop, anywhere with internet.
- **Installable on iPhone & Android** — add it to your home screen and it behaves like a native app, no browser chrome, works offline for viewing.
- **No backend server to maintain** — just static files + a free Firebase project. Hosted for free on GitHub Pages.
- **Your data, your project** — every user deploys their own copy with their own Firebase project. Nobody shares your data.

---

## 📱 Preview

| Dashboard | Vehicle Detail | Log a Service |
|---|---|---|
| _Add your own screenshot here_ | _Add your own screenshot here_ | _Add your own screenshot here_ |

> Tip: take a screenshot from your phone after setup and drop it in an `screenshots/` folder, then update the table above.

---

## 🧰 Tech Stack

- Vanilla HTML / CSS / JavaScript (no framework, no build step)
- [Firebase Firestore](https://firebase.google.com/products/firestore) — real-time cloud database (free tier)
- [Firebase Authentication](https://firebase.google.com/products/auth) (Anonymous sign-in) — lightweight access control
- [GitHub Pages](https://pages.github.com/) — free static hosting
- Web App Manifest + Service Worker — installable, app-like experience on iOS & Android

Total cost to run: **$0**, within Firebase's free (Spark) tier for personal use.

---

## 🚀 Deploy Your Own Copy

This project is designed so **everyone runs their own independent instance** — your maintenance data is private to you, stored in your own Firebase project.

1. **Fork this repository** (top-right "Fork" button on GitHub).
2. Follow **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** — a full step-by-step walkthrough (~15-20 minutes) covering:
   - Creating a free Firebase project
   - Enabling Firestore + Anonymous Authentication
   - Setting security rules so only your app can read/write your data
   - Deploying to GitHub Pages
   - Installing the app on your iPhone/Android home screen
3. Open your new URL, register your vehicles, and start logging services.

No coding experience required — it's mostly clicking through Firebase Console and GitHub settings.

---

## 🛠️ Customizing for Your Own Vehicles

All maintenance intervals live in one file: **[`schedules.js`](./schedules.js)**. Each vehicle type is a plain JavaScript object listing its service items and intervals (in km and/or months). To add your own vehicle model or change an interval:

```js
mycustomvehicle: {
  label: "Honda Civic 1.5 Turbo",
  vehicleClass: "car",
  icon: "🚗",
  items: {
    engine_oil: {
      label: "Engine Oil",
      hasOilType: true,
      oilTypes: {
        semi:  { label: "Semi-Synthetic", km: 7000, months: 6 },
        fully: { label: "Fully Synthetic", km: 10000, months: 6 }
      }
    },
    coolant: { label: "Coolant", km: 40000, months: null },
    // ...add more items as needed
  }
}
```

Add your new object to `VEHICLE_TYPES` and it instantly shows up in the "+ Kenderaan / + Vehicle" dropdown — no other code changes needed.

---

## 🗺️ Roadmap / Ideas

Not built yet, but reasonable next steps if you want to extend it:

- Push/email/Telegram/WhatsApp reminders when a service is due soon
- Google Sign-In (instead of anonymous) if you want multiple people sharing one deployed instance safely, with data scoped per account
- Service cost tracking / spending history
- Export service history to PDF or CSV
- Photo attachments per service log (receipts, parts)

---

## 🤝 Contributing

This started as a personal project, but pull requests are welcome — bug fixes, new vehicle presets, translations, UI polish, etc. Open an issue first if you're planning a larger change.

---

## 📄 License

Released under the [MIT License](./LICENSE) — free to use, modify, and deploy for personal or commercial purposes.

---

## 🙏 Credits

Built by [Safwan](https://github.com/) with help from Claude. Maintenance intervals are general rule-of-thumb figures for personal reference — always double-check against your vehicle's owner manual or workshop advice for anything safety-critical (brakes, tires, etc).
