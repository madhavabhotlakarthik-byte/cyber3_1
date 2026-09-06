-- ============================================================
-- DRK Attendance — Supabase Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Create the students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  section TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create the attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  is_present BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, attendance_date)
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_students_roll ON public.students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_section ON public.students(section);

-- 4. Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies — public can read students and attendance
CREATE POLICY "Public can view students"
  ON public.students FOR SELECT USING (true);

CREATE POLICY "Public can view attendance"
  ON public.attendance FOR SELECT USING (true);

-- 6. RLS Policies — authenticated/service_role can insert/update/delete
CREATE POLICY "Service role can manage students"
  ON public.students FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage attendance"
  ON public.attendance FOR ALL USING (auth.role() = 'service_role');

-- 7. Seed the student master list
INSERT INTO public.students (roll_number, name, section, active) VALUES
-- Main group (24N71A62XX)
('24N71A6201', 'AKANA NAGA VENKATA SATYA SAI GANESH', 'main', true),
('24N71A6203', 'BANDARI SAI', 'main', true),
('24N71A6204', 'BANDI MADHU SRI', 'main', true),
('24N71A6205', 'BANLOLU HEMANTH KUMAR', 'main', true),
('24N71A6206', 'BHATTU JASWANTH', 'main', true),
('24N71A6207', 'BOKKA MANASA', 'main', true),
('24N71A6208', 'BUDIGI LAXMAN', 'main', true),
('24N71A6209', 'BURUGU AMULYA', 'main', true),
('24N71A6211', 'CHINTAGUNTLA AKSHAYA', 'main', true),
('24N71A6213', 'DHARMANA PRAVALIKA', 'main', true),
('24N71A6214', 'DIVYA PUNITH CHANDU', 'main', true),
('24N71A6215', 'DWARAM THISHAN KARTHIK', 'main', true),
('24N71A6217', 'FATIMA BEGUM', 'main', true),
('24N71A6218', 'GOLKONDA PRAVEEN', 'main', true),
('24N71A6219', 'GOLLAPALLI HARSHA VARDHAN GURU', 'main', true),
('24N71A6220', 'IMAMUDDEEN', 'main', true),
('24N71A6221', 'JANUMALA VISHWAS', 'main', true),
('24N71A6222', 'KADAGALA GANESH', 'main', true),
('24N71A6223', 'KAKARLAPUDI CHINMAYI SAI SREE HASINI', 'main', true),
('24N71A6224', 'KANNASANI NANDINI', 'main', true),
('24N71A6225', 'KATIKALA SHIVA NAGA DURGA PRASAD', 'main', true),
('24N71A6226', 'KINDODDI ROHAN', 'main', true),
('24N71A6227', 'KOMIRE MANISH', 'main', true),
('24N71A6228', 'KUNTA PRANITHA REDDY', 'main', true),
('24N71A6230', 'MACHKURI PRASANNA LAXMI', 'main', true),
('24N71A6231', 'MADHAVABHOTLA KARTHIK', 'main', true),
('24N71A6232', 'MALUGARI JAGADESHWAR', 'main', true),
('24N71A6233', 'MANDALI VIPLAV KUMAR', 'main', true),
('24N71A6235', 'MARUKURTHI TEJA SRI VEERAMATHA', 'main', true),
('24N71A6237', 'MIRIYALA SAHITHI', 'main', true),
('24N71A6238', 'NAIKINI NITHIN', 'main', true),
('24N71A6239', 'OGILL RAJESH', 'main', true),
('24N71A6240', 'ORAM PRANAY KUMAR', 'main', true),
('24N71A6241', 'ORSU VIVEKANANDA', 'main', true),
('24N71A6242', 'PAMULAPATI MIDHUNA SPOORTHI', 'main', true),
('24N71A6243', 'PAWAR GIRI', 'main', true),
('24N71A6244', 'PIRIDI CHANIKYA', 'main', true),
('24N71A6245', 'POLAVARAM JAYA BABU', 'main', true),
('24N71A6249', 'REDDY VENKAT SIDDARADHA', 'main', true),
('24N71A6250', 'SANDIRI RENU SRI', 'main', true),
('24N71A6251', 'SANKARI DEEKSHITHA', 'main', true),
('24N71A6253', 'SWETHA KUMARI', 'main', true),
('24N71A6254', 'UPPARI ASHVITHA', 'main', true),
('24N71A6255', 'VAINALA DILEEP', 'main', true),
('24N71A6256', 'VANKDOTH MADUSUDHAN NAIK', 'main', true),
('24N71A6258', 'VONGATI MEGHANA REDDY', 'main', true),
('24N71A6259', 'YELLAM HEMANTH KUMAR', 'main', true),
-- Separate group (25N75A62XX) — l_section
('25N75A6201', 'GADDEPOGU DEEKSHITH', 'l_section', true),
('25N75A6202', 'GANDLA NARENDAR', 'l_section', true),
('25N75A6203', 'KODIREKKA BHARATH CHANDRA', 'l_section', true),
('25N75A6204', 'KORSA JANRAJU', 'l_section', true),
('25N75A6205', 'MODALA SRAVANI', 'l_section', true),
('25N75A6206', 'NEELI KAVYA', 'l_section', true);
