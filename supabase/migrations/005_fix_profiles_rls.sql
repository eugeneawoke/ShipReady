-- Fix profiles RLS: FOR ALL without WITH CHECK blocks INSERT via RLS.
-- The trigger runs as SECURITY DEFINER so it bypasses RLS, but explicit
-- WITH CHECK makes the policy correct for any direct inserts too.
DROP POLICY IF EXISTS "service role can update profiles" ON profiles;
CREATE POLICY "service role can update profiles" ON profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Re-ensure trigger exists (idempotent, protects against missing trigger in prod)
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();
