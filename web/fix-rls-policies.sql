-- Fix RLS policies for user registration
-- Run this in your Supabase SQL Editor

-- First, check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'equipment', 'user_equipment', 'triage_History');

-- Disable RLS temporarily for easier setup (you can enable it later with proper policies)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE "triage_History" DISABLE ROW LEVEL SECURITY;

-- Alternative: Create proper RLS policies that allow anonymous users to register
-- Uncomment these if you want to keep RLS enabled:

-- Drop existing policies if they exist
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON users;
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON equipment;
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON user_equipment;
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON "triage_History";

-- Create policies that allow anonymous users to register
-- CREATE POLICY "Allow anonymous user registration" ON users
--   FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Allow authenticated users full access" ON users
--   FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow anonymous equipment access" ON equipment
--   FOR ALL USING (true);

-- CREATE POLICY "Allow anonymous user_equipment access" ON user_equipment
--   FOR ALL USING (true);

-- CREATE POLICY "Allow anonymous triage access" ON "triage_History"
--   FOR ALL USING (true);

-- Verify RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'equipment', 'user_equipment', 'triage_History');
