-- CHECK STORAGE POLICIES
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
