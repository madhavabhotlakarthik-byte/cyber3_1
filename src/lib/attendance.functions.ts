import { createHash, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";

type StudentInfo = { id: string; roll_number: string; name: string; section: string };
type AttendanceInfo = { student_id: string; attendance_date: string; is_present: boolean };

export const getStudents = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, roll_number, name, section")
    .eq("active", true)
    .order("roll_number");
  if (error) throw new Error("Unable to load students.");
  return (data ?? []) as StudentInfo[];
});

export const getAttendance = createServerFn({ method: "GET" })
  .validator(z.object({ fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin.from("attendance").select("student_id, attendance_date, is_present");
    if (data?.date) {
      query = query.eq("attendance_date", data.date);
    } else {
      query = query.gte("attendance_date", data?.fromDate ?? "2026-09-01");
    }
    const { data: rows, error } = await query;
    if (error) throw new Error("Unable to load attendance.");
    return (rows ?? []) as AttendanceInfo[];
  });

type AttendanceSession = { isAdmin?: boolean };

function sessionConfig() {
  return {
    password: process.env["ATTENDANCE_SESSION_SECRET"]!,
    name: "drk-attendance-admin",
    maxAge: 60 * 60 * 8,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

function secretMatches(input: string, expected: string) {
  const inputHash = createHash("sha256").update(input, "utf8").digest();
  const expectedHash = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(inputHash, expectedHash);
}

async function requireAdmin() {
  const session = await useSession<AttendanceSession>(sessionConfig());
  if (!session.data.isAdmin) {
    throw new Error("Unauthorized");
  }
  return session;
}

export const getAdminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<AttendanceSession>(sessionConfig());
  return { isAdmin: session.data.isAdmin === true };
});

export const loginAdmin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().trim().email().max(255),
      password: z.string().min(1).max(200),
    }),
  )
  .handler(async ({ data }) => {
    const expectedEmail = process.env["ATTENDANCE_ADMIN_EMAIL"];
    const expectedPassword = process.env["ATTENDANCE_ADMIN_PASSWORD"];
    const emailMatches = expectedEmail ? secretMatches(data.email.toLowerCase(), expectedEmail.toLowerCase()) : false;
    const passwordMatches = expectedPassword ? secretMatches(data.password, expectedPassword) : false;

    if (!emailMatches || !passwordMatches) {
      return { ok: false as const };
    }

    const session = await useSession<AttendanceSession>(sessionConfig());
    await session.update({ isAdmin: true });
    return { ok: true as const };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AttendanceSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

const saveAttendanceSchema = z.object({
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      isPresent: z.boolean(),
    }),
  ).min(1).max(100),
});

export const saveAttendance = createServerFn({ method: "POST" })
  .validator((input) => saveAttendanceSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdmin();

    const startDate = "2026-09-01";
    const today = new Date().toISOString().slice(0, 10);
    if (data.attendanceDate < startDate || data.attendanceDate > today) {
      throw new Error("Attendance date must be between September 1, 2026 and today.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: students, error: studentsError } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("active", true);
    if (studentsError) throw new Error("Unable to validate students.");

    const validStudentIds = new Set((students ?? []).map((student) => student.id));
    if (data.records.some((record) => !validStudentIds.has(record.studentId))) {
      throw new Error("One or more student records are invalid.");
    }

    const rows = data.records.map((record) => ({
      student_id: record.studentId,
      attendance_date: data.attendanceDate,
      is_present: record.isPresent,
    }));
    const { error } = await supabaseAdmin.from("attendance").upsert(rows, {
      onConflict: "student_id,attendance_date",
    });
    if (error) throw new Error("Unable to save attendance.");

    return { ok: true as const };
  });