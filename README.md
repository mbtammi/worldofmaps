# World of Maps 🌍

A fun, daily puzzle game where players guess what dataset a mysterious map represents. Inspired by Wordle and GeoGuessr, this game challenges your geography, culture, and data knowledge in a lightweight, shareable format.

## 🎯 Core Gameplay
- **One Map per Day**: Everyone sees the same challenge.
- **Guessing**: Players type their guess (e.g., "population density", "coffee consumption").
- **Hints**: Each wrong guess reveals a clue.
- **Reveal**: Show correct answer + fun fact when solved.
- **Share Results**: Emoji grid like Wordle (for bragging rights).

## 🛠 Tech Stack
- **Frontend**: React 18 + Vite (JavaScript)
- **Styling**: Traditional CSS (no Tailwind)
- **Map Visualization**: Leaflet or Mapbox GL JS (choropleth layers)
- **State Management**: Simple React hooks (Zustand optional later)
- **Backend (MVP)**: Supabase/Firebase for storing streaks and answers
- **Deployment**: Netlify or Vercel

## 📊 Data Sources
- [Our World in Data](https://ourworldindata.org/)  
- [World Bank Open Data](https://data.worldbank.org/)  
- [UN Data](https://data.un.org/)  
- [Kaggle Datasets](https://www.kaggle.com/datasets)  

Start MVP with ~10 curated datasets (population, internet usage, coffee, CO₂ emissions, happiness index).

## 🎨 Game Design
- Minimal map visuals (clean colors, easy to compare).
- Fun balance of **serious maps** (climate, population) and **quirky maps** (coffee, fast food, Spotify streams).
- Streak system to encourage daily play.

## 🚀 Roadmap
**Week 1**
- Basic React app
- Hardcoded single map challenge

**Week 2**
- Add multiple datasets
- Guess + hint + reveal logic

**Week 3**
- Add streaks, shareable results
- Polish design

**Week 4 (Launch)**
- Public launch with 10 maps
- Social media posting campaign

## 💡 Future Features
- **Guess the Year Mode**: Historical datasets
- **Custom Challenges**: Challenge friends with specific maps
- **Premium Features**: Extra maps/day, archive access
- **Leaderboards**: Weekly or global competition
- **Mobile App**: Push notifications for streaks

## 🔑 Success Metrics
- Daily retention
- Shares per user
- Organic growth rate
