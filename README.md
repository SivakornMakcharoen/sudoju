# Sudoku Logbook

เกมซูโดกุพร้อม leaderboard ออนไลน์ ใช้ Supabase เป็น backend

## โครงสร้างโปรเจกต์

```
sudoju/
├── index.html
├── .env                  ← credentials (ไม่ commit)
├── .env.example          ← template สำหรับ commit
├── package.json
└── src/
    ├── main.js           ← entry point + app shell + routing
    ├── styles/
    │   └── main.css      ← design tokens + all styles
    ├── lib/
    │   ├── supabase.js   ← Supabase client (อ่าน env อัตโนมัติ)
    │   ├── puzzle.js     ← สร้าง/ตรวจสอบ puzzle
    │   ├── players.js    ← CRUD ข้อมูลผู้เล่น (Supabase)
    │   └── utils.js      ← helper functions
    ├── screens/
    │   ├── RegisterScreen.js  ← หน้าลงทะเบียน/login
    │   ├── LevelScreen.js     ← เลือกระดับ + rank preview
    │   └── GameScreen.js      ← หน้าเล่นเกม + win modal
    └── components/
        ├── Board.js           ← ตาราง sudoku
        └── LeaderboardModal.js ← modal leaderboard
```

## เริ่มใช้งาน

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. ตั้งค่า environment variables
```bash
cp .env.example .env
```
แล้วแก้ไข `.env` ใส่ค่าจาก Supabase project ของคุณ:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

### 3. รัน dev server
```bash
npm run dev
```

### 4. Build สำหรับ production
```bash
npm run build
```

## Supabase Schema

ต้องมี table `players` ใน Supabase:

```sql
create table players (
  email      text primary key,
  name       text not null,
  stats      jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: อนุญาตให้ anon อ่าน/เขียนได้ (เกมนี้ไม่มี auth)
alter table players enable row level security;
create policy "public read"  on players for select using (true);
create policy "public write" on players for insert with check (true);
create policy "public update" on players for update using (true);
```
