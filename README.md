# CineSeat

A cinema booking site where you **walk through the hall in 3D before you book**. You can sit in any seat, see the screen from there, pick your seats in the 3D hall and get an e-ticket with a QR code.

Built with Next.js, Three.js (React Three Fiber + drei) and Tailwind. It runs fully in the browser with no backend, so it deploys to Vercel's free tier as-is.

## Features

- **Full 3D hall:** a 16 m curved screen playing an animated trailer that lights the room in its colours, a projector beam with floating dust, velvet curtains, a stage, stadium seating, lit aisle steps, wall lights, EXIT doors and a star ceiling.
- **Orbit mode:** drag to rotate, scroll or pinch to zoom, right-drag to pan.
- **Walk mode:** first-person movement with WASD / arrow keys (Shift to run) and drag to look. On phones there's an on-screen joystick. You climb the steps, can't walk through seat rows, and can go right up to the screen.
- **Sit in any seat:** the camera flies to that seat's eye height so you see your real view of the screen.
- **Book in 3D:** click seats in the hall to select them. Colours show category and whether a seat is free or booked, and selected seats get a floating label. There's an optional mini map.
- **Checkout:** seats are held for 5 minutes with a countdown, and payment is a demo (Card / JazzCash / EasyPaisa).
- **E-ticket:** shows a QR code, booking ID and seats, and can be printed or saved as PDF. A "See my seat in 3D" button takes you to your seat.
- **Extras:** house lights on/off, play your own video file on the big screen, full screen.
- **Performance:** seats are instanced (one draw call per seat part), and resolution and post-processing scale down automatically on slower devices.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (all pages are static)
```

## Deploy to Vercel

Push the folder to GitHub, import it in Vercel and click Deploy. No environment variables are required. If you use a custom domain, set `NEXT_PUBLIC_SITE_URL` (for example `https://cineseat.pk`) so social share previews link to it. Otherwise the Vercel production URL is used.

## Credits

The home-page hero footage is made from free clips from [Mixkit](https://mixkit.co/free-stock-video/cinema/) (Mixkit Stock Video Free License).

## Project structure

| Path | What it does |
|---|---|
| `src/lib/layout.ts` | Hall geometry: rows, seats, steps, collision boxes, eye position for each seat |
| `src/lib/store.ts` | App state (zustand): selection, holds, bookings saved in localStorage, sold-seat simulation |
| `src/lib/movies.ts` | Movies, showtimes, prices |
| `src/components/three/` | The 3D scene: `Room`, `Screen` (trailer shader, beam, light), `Seats`, `Controls` (orbit / walk / seat view) |
| `src/components/ui/` | Screens around the 3D view: overlay, booking panel, mini map, joystick |
| `src/app/` | Pages: `/`, `/cinema`, `/book`, `/checkout`, `/ticket` |

## Notes

- Seats that are already "sold" are generated the same way every time for each showtime, so each show looks realistically busy. Your own bookings are saved in the browser.
- No real payment or email happens. This is a demo booking flow.
