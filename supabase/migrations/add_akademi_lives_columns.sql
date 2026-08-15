-- Migration: tambahkan kolom untuk persistensi Akademi dan Lives cooldown
-- Jalankan ini di Supabase Dashboard → SQL Editor

-- 1. Kolom untuk menyimpan modul yang sudah diselesaikan
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS completed_module_ids TEXT[] DEFAULT '{}';

-- 2. Kolom untuk menyimpan jumlah nyawa (default 3)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS lives INTEGER DEFAULT 3;

-- 3. Kolom untuk menyimpan timestamp kapan nyawa akan terisi ulang
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS lives_refill_at TIMESTAMPTZ DEFAULT NULL;

-- Pastikan semua profil yang sudah ada memiliki nilai default
UPDATE profiles
  SET lives = 3
  WHERE lives IS NULL;

UPDATE profiles
  SET completed_module_ids = '{}'
  WHERE completed_module_ids IS NULL;
