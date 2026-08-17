# Sur-Sansar (Bharat Ke Sur) 🇮🇳 🎵

An interactive, immersive web application that allows users to explore the rich, diverse traditional folk and classical music of India. By interacting with a map of the country, users can click on any state or union territory to instantly hear authentic regional music native to that area.

## ✨ Features

- **Interactive SVG Map**: A fully clickable, hover-responsive map of India representing all 36 states and union territories.
- **Authentic Regional Audio**: Distinct, high-quality folk and classical tracks mapped perfectly to their respective states (e.g., Chhath Puja music in Bihar, Baul Sangeet in West Bengal, Carnatic in Tamil Nadu).
- **Robust Audio Engine**: Built-in audio player utilizing `Howler.js` with HTML5 audio streaming to ensure smooth playback without overlaps.
- **Global State Management**: Powered by `Zustand` to coordinate playback state seamlessly between the map clicks and the floating audio player UI.
- **Modern, Beautiful UI**: Designed with Tailwind CSS v4 and Framer Motion for glassy, premium aesthetics and micro-animations.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router), React 19
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Audio**: [Howler.js](https://howlerjs.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Map Data**: `@svg-maps/india`
- **Database/Backend (Optional)**: [Supabase](https://supabase.com/)

---

## 🚀 How We Built It (The Journey)

Building this project involved solving several interesting UI and data challenges:

1. **Map Integration**: We started by integrating `@svg-maps/india` to render the SVG paths. We customized the SVG scaling and applied dynamic Tailwind fill colors to handle hover states and active selections.
2. **Audio Architecture**: Standard HTML5 `<audio>` tags were prone to overlapping and state-sync issues across components. We implemented `Howler.js` wrapped in a global `Zustand` store so that selecting a new state instantly stops the previous track and smoothly transitions to the new one.
3. **Data Curation**: We researched and mapped out the most iconic folk/classical musical styles and instruments for all 36 Indian regions in `lib/queries.ts`.
4. **Automated Audio Scraping**: Finding 36 distinct regional tracks manually would take days. We wrote a custom Node.js script (`download_music.js`) that uses `yt-dlp` to search and fetch public/royalty-free audio tracks directly from SoundCloud based on the curated folk music titles. 
5. **DRM Handling**: Handled exceptions for states that hit DRM walls (like Uttarakhand and West Bengal) by dynamically mapping them to adjacent cultural regions to ensure the user experience never breaks.

---

## 💻 Getting Started (How to Run This Locally)

If you want to build or run this project on your local machine, follow these steps:

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **yt-dlp** (Required if you want to re-run the audio fetcher script to download MP3s). Install via Homebrew: `brew install yt-dlp` or pip: `pip install yt-dlp`.

### 2. Clone and Install
```bash
git clone https://github.com/sa50tyam11/SUR-SANSAR.git
cd SUR-SANSAR
npm install
```

### 3. Fetch the Audio Files (Important)
Because audio files are large, you might need to run the fetching script to populate your `public` folder with the state MP3s. 
```bash
node download_music.js
```
*This will take 3-5 minutes. It searches SoundCloud for authentic regional music and downloads them as `.mp3` files into the `public/` directory.*

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:40009](http://localhost:40009) with your browser to see the result. Click on any state on the map to start listening!

---

## 📂 Project Structure

- `app/` - Next.js App Router pages and layout.
- `components/map/` - Contains the `IndiaMap.tsx` component handling the interactive SVG.
- `components/player/` - Contains the `AudioPlayer.tsx` and UI for the playback bar.
- `store/` - `usePlayerStore.ts` (Zustand store for audio logic).
- `lib/` - Supabase schemas and the `queries.ts` file containing all the state and track metadata.
- `public/` - Where all the downloaded `.mp3` files are stored.
- `download_music.js` - The automation script used to fetch tracks.
