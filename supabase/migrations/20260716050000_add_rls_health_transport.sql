-- Ativar RLS para as tabelas
ALTER TABLE "public"."student_health_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."student_transportation" ENABLE ROW LEVEL SECURITY;

-- Política de leitura (SELECT)
CREATE POLICY "Enable read access for all authenticated users" 
ON "public"."student_health_records" FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all authenticated users" 
ON "public"."student_transportation" FOR SELECT USING (auth.role() = 'authenticated');

-- Política de inserção (INSERT)
CREATE POLICY "Enable insert access for all authenticated users" 
ON "public"."student_health_records" FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for all authenticated users" 
ON "public"."student_transportation" FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização (UPDATE)
CREATE POLICY "Enable update access for all authenticated users" 
ON "public"."student_health_records" FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for all authenticated users" 
ON "public"."student_transportation" FOR UPDATE USING (auth.role() = 'authenticated');

-- Política de deleção (DELETE)
CREATE POLICY "Enable delete access for all authenticated users" 
ON "public"."student_health_records" FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for all authenticated users" 
ON "public"."student_transportation" FOR DELETE USING (auth.role() = 'authenticated');
