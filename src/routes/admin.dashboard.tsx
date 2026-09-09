import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, LogOut, Save, Search, ShieldCheck, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getAdminStatus, getAttendance, getStudents, loginAdmin, logoutAdmin, saveAttendance } from "@/lib/attendance.functions";

type Student = { id: string; roll_number: string; name: string; section: string };
type AttendanceRow = { student_id: string; attendance_date: string; is_present: boolean };
const START_DATE = "2026-09-01";
const TODAY = new Date().toISOString().slice(0, 10);

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard — DRK Attendance" }, { name: "description", content: "Secure attendance management for DRK Cyber Security 3-1." }, { property: "og:title", content: "Admin Dashboard — DRK Attendance" }, { property: "og:description", content: "Secure attendance management for DRK Cyber Security 3-1." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState("admin143@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [selectedDate, setSelectedDate] = useState(TODAY < START_DATE ? START_DATE : TODAY);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkAdmin = async () => { try { const result = await getAdminStatus(); setIsAdmin(result.isAdmin); } catch { setIsAdmin(false); } };
  useEffect(() => { void checkAdmin(); }, []);
  useEffect(() => { if (isAdmin) void loadAttendance(); }, [isAdmin, selectedDate]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const [students, attendance] = await Promise.all([
        getStudents(),
        getAttendance({ data: { date: selectedDate } }),
      ]);
      setStudents(students);
      setAttendance(attendance);
    } catch {
      toast.error("Could not load attendance.");
    }
    setLoading(false);
  };

  const dateAttendance = useMemo(() => new Map(attendance.map((row) => [row.student_id, row.is_present])), [attendance]);
  const [draft, setDraft] = useState<Map<string, boolean>>(new Map());
  useEffect(() => setDraft(new Map(dateAttendance)), [dateAttendance]);
  const filteredStudents = students.filter((student) => `${student.roll_number} ${student.name}`.toLowerCase().includes(search.toLowerCase()));
  const presentCount = [...draft.values()].filter(Boolean).length;
  const absentCount = [...draft.values()].filter((value) => value === false).length;

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    const result = await loginAdmin({ data: { email, password } });
    if (!result.ok) { toast.error("Invalid admin credentials"); return; }
    setPassword("");
    setIsAdmin(true);
    toast.success("Login successful");
  }

  async function handleSave() {
    if (draft.size !== students.length) { toast.error("Please mark every student present or absent before saving."); return; }
    setSaving(true);
    try {
      await saveAttendance({ data: { attendanceDate: selectedDate, records: students.map((student) => ({ studentId: student.id, isPresent: draft.get(student.id) === true })) } });
      toast.success("Attendance saved successfully");
      await loadAttendance();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Attendance could not be saved."); }
    setSaving(false);
  }

  async function handleLogout() { await logoutAdmin(); setIsAdmin(false); toast.success("Logged out successfully"); await navigate({ to: "/" }); }

  if (isAdmin === null) return <div className="grid min-h-screen place-items-center bg-background"><div className="skeleton h-12 w-48" /></div>;
  if (!isAdmin) return <LoginCard email={email} password={password} showPassword={showPassword} setEmail={setEmail} setPassword={setPassword} setShowPassword={setShowPassword} onSubmit={handleLogin} />;

  return <div className="min-h-screen bg-background text-foreground"><header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"><Link to="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></span><span><b className="block text-sm">DRK ATTENDANCE</b><span className="text-xs text-muted-foreground">Admin portal</span></span></Link><div className="flex gap-2"><Button variant="outline" size="sm" asChild><Link to="/"><ArrowLeft /> Public view</Link></Button><Button variant="ghost" size="sm" onClick={() => void handleLogout()}><LogOut /> Logout</Button></div></div></header><main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Secure administrator workspace</p><h1 className="section-title">Mark attendance</h1><p className="mt-2 text-muted-foreground">Cyber Security · 3-1 · {students.length} students</p></div><label className="grid gap-2 text-sm font-medium">Attendance date<input className="control" type="date" min={START_DATE} max={TODAY} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label></div><div className="mt-8 grid gap-4 sm:grid-cols-3"><AdminStat label="Present" value={presentCount} tone="green" /><AdminStat label="Absent" value={absentCount} tone="red" /><AdminStat label="Total" value={students.length} tone="neutral" /></div><div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="control pl-10" placeholder="Search students..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setDraft(new Map(students.map((student) => [student.id, true])))}><Check /> Select all</Button><Button variant="outline" size="sm" onClick={() => setDraft(new Map(students.map((student) => [student.id, false])))}><Sun /> Mark all absent</Button></div></div><div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">{loading ? <div className="grid gap-4 p-6">{[1, 2, 3, 4].map((row) => <div className="skeleton h-10" key={row} />)}</div> : <div className="divide-y divide-border">{filteredStudents.map((student) => <label className="flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/40 sm:px-6" key={student.id}><Checkbox checked={draft.get(student.id) === true} onCheckedChange={(checked) => setDraft((current) => new Map(current).set(student.id, checked === true))} /><span className="min-w-24 font-mono text-sm font-semibold text-primary">{student.roll_number}</span><span className="flex-1 text-sm font-medium">{student.name}<span className="ml-2 text-xs font-normal text-muted-foreground">{student.section === "l_section" ? "L Section" : "Main group"}</span></span><span className={draft.get(student.id) === true ? "status-present" : draft.has(student.id) ? "status-absent" : "status-unmarked"}>{draft.get(student.id) === true ? "Present" : draft.has(student.id) ? "Absent" : "Unmarked"}</span></label>)}</div>}</div><div className="sticky bottom-4 mt-6 flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur"><p className="text-sm text-muted-foreground">{selectedDate} · {presentCount} present · {absentCount} absent</p><Button onClick={() => void handleSave()} disabled={saving || loading}>{saving ? "Saving..." : <><Save /> Save attendance</>}</Button></div></main></div>;
}

function LoginCard({ email, password, showPassword, setEmail, setPassword, setShowPassword, onSubmit }: { email: string; password: string; showPassword: boolean; setEmail: (value: string) => void; setPassword: (value: string) => void; setShowPassword: (value: boolean) => void; onSubmit: (event: React.FormEvent) => void }) { return <main className="grid min-h-screen place-items-center bg-muted/30 px-4 py-12"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8"><Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to public attendance</Link><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck /></span><div><p className="text-sm font-bold">DRK ATTENDANCE</p><p className="text-xs text-muted-foreground">Admin portal</p></div></div><h1 className="mt-8 text-2xl font-bold">Sign in to manage attendance</h1><p className="mt-2 text-sm text-muted-foreground">Only the authorized administrator can access this workspace.</p><form className="mt-7 grid gap-5" onSubmit={onSubmit}><label className="grid gap-2 text-sm font-medium">Email<input className="control" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label className="grid gap-2 text-sm font-medium">Password<div className="relative"><input className="control pr-20" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button></div></label><Button type="submit" className="mt-1 w-full">Sign in</Button></form></div></main>; }
function AdminStat({ label, value, tone }: { label: string; value: number; tone: "green" | "red" | "neutral" }) { return <div className={`stat-card stat-${tone}`}><span className="text-sm font-medium">{label}</span><b className="mt-2 block text-3xl">{value}</b></div>; }