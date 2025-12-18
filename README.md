# University Fit Hub

A modern web app to help students discover best‑fit universities based on interests, programs, and personal preferences. Built with Vite, React, TypeScript, Tailwind CSS, and shadcn‑ui. Generated with Lovable and customized in this repo.

## ✨ Features
- Clean, student‑friendly UI built with shadcn‑ui components
- Fast dev experience powered by Vite
- TypeScript‑first codebase for reliability and DX
- Tailwind CSS for responsive, accessible styling
- Supabase‑ready (auth/storage/db) — see `supabase/` for config
- One‑click publish via Lovable

## 🧱 Tech Stack
- Vite • React • TypeScript
- Tailwind CSS • shadcn‑ui
- Supabase (optional services)
- ESLint with modern TS configs

Environment:
# Example (adjust per your Supabase project)
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY

Project Structure:
.
├── public/            # Static assets
├── src/               # App source (components, pages, hooks)
├── supabase/          # Supabase config & migrations (if used)
├── index.html
├── tailwind.config.ts
├── vite.config.ts
└── package.json
