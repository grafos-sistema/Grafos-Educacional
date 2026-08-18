-- Ativar RLS para as tabelas
ALTER TABLE "public"."student_health_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_transportation" ENABLE ROW LEVEL SECURITY;

-- Política de leitura (SELECT)
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON "public"."student_health_records";
CREATE POLICY "Enable read access for all authenticated users" 
ON "public"."student_health_records" FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON "public"."student_transportation";
CREATE POLICY "Enable read access for all authenticated users" 
ON "public"."student_transportation" FOR SELECT USING (auth.role() = 'authenticated');

-- Política de inserção (INSERT)
DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON "public"."student_health_records";
CREATE POLICY "Enable insert access for all authenticated users" 
ON "public"."student_health_records" FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert access for all authenticated users" ON "public"."student_transportation";
CREATE POLICY "Enable insert access for all authenticated users" 
ON "public"."student_transportation" FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização (UPDATE)
DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON "public"."student_health_records";
CREATE POLICY "Enable update access for all authenticated users" 
ON "public"."student_health_records" FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update access for all authenticated users" ON "public"."student_transportation";
CREATE POLICY "Enable update access for all authenticated users" 
ON "public"."student_transportation" FOR UPDATE USING (auth.role() = 'authenticated');

-- Política de deleção (DELETE)
DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON "public"."student_health_records";
CREATE POLICY "Enable delete access for all authenticated users" 
ON "public"."student_health_records" FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete access for all authenticated users" ON "public"."student_transportation";
CREATE POLICY "Enable delete access for all authenticated users" 
ON "public"."student_transportation" FOR DELETE USING (auth.role() = 'authenticated');
