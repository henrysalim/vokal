-- Migration: Reset XP semua akun pengguna ke 0 XP
-- Jalankan ini di Supabase Dashboard → SQL Editor

-- 1. Atur nilai default kolom xp di tabel profiles menjadi 0 (bukan 1500)
ALTER TABLE profiles 
  ALTER COLUMN xp SET DEFAULT 0;

-- 2. Reset semua data profil penguji/pengguna yang ada saat ini ke 0 XP
UPDATE profiles 
  SET xp = 0;

-- 3. (Opsional) Jika ingin menetapkan beberapa pengguna contoh dengan skor realistis bertahap:
-- UPDATE profiles SET xp = 110 WHERE email LIKE '%budi%';
-- UPDATE profiles SET xp = 60 WHERE email LIKE '%sri%';
