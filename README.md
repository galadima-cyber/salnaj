# Salnaj — White-Label VTU Platform
## Web Application (Phase 1)

### Project Structure
```
web-app/
├── src/
│   ├── config/
│   │   └── brand.config.ts     ← WHITE-LABEL CONTROL FILE
│   ├── pages/
│   │   ├── LandingPage.tsx     ← Public landing page
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   └── dashboard/
│   │       └── DashboardPage.tsx
│   ├── components/
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       └── Footer.tsx
│   ├── hooks/
│   │   └── useTheme.ts         ← Dark/light mode
│   └── utils/index.ts
```

### Getting Started
```bash
cd web-app
npm install
npm run dev       # Development server
npm run build     # Production build
```

### White-Label (New Client)
1. Copy this project folder
2. Open `src/config/brand.config.ts`
3. Update: app name, colors, contact details, feature toggles
4. Swap logo in `public/assets/`
5. Deploy

### Pages Built
- ✅ Landing Page (Hero, Services, Smart Buy, How It Works, Stats, Testimonials, FAQ, CTA)
- ✅ Login Page
- ✅ Register Page (with password strength meter)
- ✅ Dashboard (wallet card, quick actions, smart buy, recent transactions, analytics teasers)

### Next Phase
- Backend (Node.js + Express + Prisma + PostgreSQL)
- Service pages (Buy Data, Airtime, Electricity, Cable TV...)
- VTPass integration
- Paystack wallet funding
- Admin dashboard
- Flutter mobile app

### Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS v4
- Framer Motion
- React Router v6
- TanStack Query
- React Hook Form + Zod
- Lucide React
