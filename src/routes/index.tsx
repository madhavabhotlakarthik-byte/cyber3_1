import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

type Student = {
  id: string;
  roll_number: string;
  name: string;
  section: string;
};

type AttendanceRow = {
  student_id: string;
  attendance_date: string;
  is_present: boolean;
};

const START_DATE = "2026-09-01";
const TODAY = new Date().toISOString().slice(0, 10);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DRK Class Attendance — Cyber Security 3-1" },
      {
        name: "description",
        content: "Attendance portal for Cyber Security 3-1 at DRK Institute of Science and Technology.",
      },
      { property: "og:title", content: "DRK Class Attendance — Cyber Security 3-1" },
      {
        property: "og:description",
        content: "Attendance portal for Cyber Security 3-1 at DRK Institute of Science and Technology.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AttendanceHome,
});

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function shortDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(`${date}T00:00:00`),
  );
}

function AttendanceHome() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [selectedDate, setSelectedDate] = useState(TODAY < START_DATE ? START_DATE : TODAY);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent">("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);
  const [cookieChoice, setCookieChoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [studentResult, attendanceResult] = await Promise.all([
      supabase.from("students").select("id, roll_number, name, section").eq("active", true).order("roll_number"),
      supabase.from("attendance").select("student_id, attendance_date, is_present").gte("attendance_date", START_DATE),
    ]);
    if (studentResult.error || attendanceResult.error) {
      toast.error("Attendance could not be loaded. Please try again.");
    } else {
      setStudents(studentResult.data ?? []);
      setAttendance(attendanceResult.data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
    const savedTheme = window.localStorage.getItem("drk-theme");
    const savedCookies = window.localStorage.getItem("drk-cookie-choice");
    setDarkMode(savedTheme === "dark");
    setCookieChoice(savedCookies);
    const onScroll = () => setShowBackTop(window.scrollY > 520);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("drk-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        if (event.key === "Escape") {
          setMobileOpen(false);
        }
        return;
      }
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
      if (event.key.toLowerCase() === "d") setDarkMode((value) => !value);
      if (event.key.toLowerCase() === "t") document.getElementById("today")?.scrollIntoView({ behavior: "smooth" });
      if (event.key.toLowerCase() === "s") document.getElementById("students")?.scrollIntoView({ behavior: "smooth" });
      if (event.key.toLowerCase() === "h") document.getElementById("history")?.scrollIntoView({ behavior: "smooth" });
      if (event.key === "/") {
        event.preventDefault();
        document.getElementById("student-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const dateAttendance = useMemo(
    () => new Map(attendance.filter((row) => row.attendance_date === selectedDate).map((row) => [row.student_id, row.is_present])),
    [attendance, selectedDate],
  );
  const visibleStudents = useMemo(() => students.filter((student) => {
    const matchesSearch = `${student.roll_number} ${student.name}`.toLowerCase().includes(search.toLowerCase());
    const isPresent = dateAttendance.get(student.id);
    const matchesStatus = statusFilter === "all" || (statusFilter === "present" ? isPresent === true : isPresent === false);
    return matchesSearch && matchesStatus;
  }), [students, search, statusFilter, dateAttendance]);
  const presentCount = students.filter((student) => dateAttendance.get(student.id) === true).length;
  const absentCount = students.filter((student) => dateAttendance.get(student.id) === false).length;
  const markedCount = presentCount + absentCount;
  const historyDates = [...new Set(attendance.map((row) => row.attendance_date))].sort().reverse();
  const studentHistory = selectedStudent
    ? attendance.filter((row) => row.student_id === selectedStudent.id).sort((a, b) => b.attendance_date.localeCompare(a.attendance_date))
    : [];

  const updateCookieChoice = (choice: string) => {
    window.localStorage.setItem("drk-cookie-choice", choice);
    setCookieChoice(choice);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
             <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><ShieldCheck className="size-5" /></span>
            <span><span className="block text-sm font-bold tracking-tight">DRK ATTENDANCE</span><span className="block text-xs text-muted-foreground">Cyber Security · 3-1</span></span>
          </a>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            <a className="nav-link" href="#today">Today</a>
            <a className="nav-link" href="#students">Students</a>
            <a className="nav-link" href="#history">History</a>
            <a className="nav-link" href="#faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label={darkMode ? "Use light mode" : "Use dark mode"} onClick={() => setDarkMode((value) => !value)}>
              {darkMode ? <Sun /> : <Moon />}
            </Button>
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex"><Link to="/admin/dashboard"><ShieldCheck /> Admin</Link></Button>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <X /> : <Menu />}</Button>
          </div>
        </div>
        {mobileOpen && <nav className="border-t border-border px-4 py-3 lg:hidden" aria-label="Mobile navigation"><div className="mx-auto grid max-w-7xl gap-1"><a className="mobile-link" href="#today" onClick={() => setMobileOpen(false)}>Today</a><a className="mobile-link" href="#students" onClick={() => setMobileOpen(false)}>Students</a><a className="mobile-link" href="#history" onClick={() => setMobileOpen(false)}>History</a><a className="mobile-link" href="#faq" onClick={() => setMobileOpen(false)}>FAQ</a><Link className="mobile-link" to="/admin/dashboard" onClick={() => setMobileOpen(false)}>Admin Login</Link></div></nav>}
      </header>

      <main id="main-content">
        <section id="top" className="border-b border-border/70 bg-muted/30">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_0.7fr] lg:px-8 lg:py-20">
             <div className="max-w-3xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground"><span className="size-2 rounded-full bg-emerald-500" /> Live class attendance portal</div><h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Know who’s in. <span className="text-primary">Stay on track.</span></h1><p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">A clear, current view of attendance for the Cyber Security 3-1 class at DRK Institute of Science and Technology.</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild><a href="#today"><CalendarDays /> View today’s attendance</a></Button></div></div>
            <div className="grid grid-cols-2 gap-3 self-end sm:grid-cols-4 lg:grid-cols-2"><Metric label="Students" value={students.length || 52} icon={<Users />} /><Metric label="Marked today" value={markedCount} icon={<Check />} /><Metric label="Present" value={presentCount} icon={<Sun />} /><Metric label="Start date" value="Sep 01" icon={<Clock3 />} /></div>
          </div>
        </section>

        <section id="today" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Daily overview</p><h2 className="section-title">Today’s attendance</h2><p className="mt-2 text-muted-foreground">Choose a date to view a saved attendance record.</p></div><label className="grid gap-2 text-sm font-medium">Attendance date<input className="control" type="date" min={START_DATE} max={TODAY} value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label></div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3"><StatCard label="Present" value={presentCount} tone="green" /><StatCard label="Absent" value={absentCount} tone="red" /><StatCard label="Total students" value={students.length} tone="neutral" /></div>
          <div className="mt-5 flex flex-wrap items-center gap-2"><Button size="sm" variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")}>Everyone</Button><Button size="sm" variant={statusFilter === "present" ? "default" : "outline"} onClick={() => setStatusFilter("present")}>Present <span className="ml-1 rounded-full bg-background/20 px-1.5">{presentCount}</span></Button><Button size="sm" variant={statusFilter === "absent" ? "default" : "outline"} onClick={() => setStatusFilter("absent")}>Absent <span className="ml-1 rounded-full bg-background/20 px-1.5">{absentCount}</span></Button><span className="text-sm text-muted-foreground">{formatDate(selectedDate)}</span></div>
          {loading ? <LoadingRows /> : markedCount === 0 ? <EmptyState icon={<CalendarDays />} title="No attendance recorded" description="Attendance for this date has not been marked by the administrator yet." /> : <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="hidden grid-cols-[1fr_1.6fr_0.6fr] gap-4 border-b border-border bg-muted/35 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid"><span>Roll number</span><span>Name</span><span>Status</span></div>{visibleStudents.map((student) => <StudentRow key={student.id} student={student} isPresent={dateAttendance.get(student.id)} onSelect={() => setSelectedStudent(student)} />)}{visibleStudents.length === 0 && <EmptyState icon={<Search />} title="No student found" description="Try searching using another name or roll number." compact />}</div>}
        </section>

        <section id="students" className="scroll-mt-24 border-y border-border/70 bg-muted/25"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><div className="max-w-2xl"><p className="eyebrow">Student lookup</p><h2 className="section-title">Find a student</h2><p className="mt-2 text-muted-foreground">Search by roll number or name to see date-wise attendance.</p></div><div className="relative mt-6 max-w-xl"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input id="student-search" className="control pl-10" placeholder="Search students..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="mt-6 flex flex-wrap gap-2">{visibleStudents.slice(0, 12).map((student) => <Button key={student.id} variant="outline" size="sm" onClick={() => setSelectedStudent(student)}>{student.roll_number}</Button>)}</div></div></section>

        <section id="history" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><div className="max-w-2xl"><p className="eyebrow">Saved records</p><h2 className="section-title">Attendance history</h2><p className="mt-2 text-muted-foreground">Public records become available as the administrator saves each date.</p></div>{historyDates.length === 0 ? <div className="mt-6"><EmptyState icon={<Clock3 />} title="No attendance history available yet" description="Saved dates will appear here." /></div> : <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{historyDates.map((date) => { const rows = attendance.filter((row) => row.attendance_date === date); const present = rows.filter((row) => row.is_present).length; return <button type="button" key={date} className="history-card" onClick={() => { setSelectedDate(date); document.getElementById("today")?.scrollIntoView({ behavior: "smooth" }); }}><span className="text-sm font-semibold">{formatDate(date)}</span><span className="mt-2 text-sm text-muted-foreground">{present} present · {rows.length - present} absent</span><ChevronDown className="ml-auto size-4 rotate-[-90deg] text-muted-foreground" /></button>; })}</div>}</section>

        <section id="faq" className="scroll-mt-24 border-t border-border/70 bg-muted/25"><div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"><p className="eyebrow">Need to know</p><h2 className="section-title">Frequently asked questions</h2><div className="mt-6 grid gap-3">{[["How is attendance marked?", "Only the authorized administrator can mark and update attendance."], ["Do students need to log in?", "No. Students and visitors can view public attendance without an account."], ["When does attendance start?", "Attendance tracking starts from September 1, 2026."], ["How is the percentage calculated?", "Present days divided by total marked days, multiplied by 100."], ["Can previous attendance be edited?", "Yes. The administrator can select a saved date and update it."]].map(([question, answer]) => <details key={question} className="faq-item"><summary>{question}<ChevronDown className="size-4" /></summary><p>{answer}</p></details>)}</div></div></section>
      </main>

       <footer className="border-t border-border"><div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>DRK Institute of Science and Technology · Cyber Security 3-1</span><span>Created by karthik-csc</span></div></footer>
      {showBackTop && <Button className="fixed bottom-6 right-6 z-30 rounded-full shadow-lg" size="icon" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp /></Button>}
      {!cookieChoice && <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-2xl flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-xl sm:flex-row sm:items-center"><p className="text-sm text-muted-foreground">We use essential cookies to keep the website secure and remember preferences.</p><div className="flex shrink-0 gap-2"><Button size="sm" onClick={() => updateCookieChoice("accepted")}>Accept</Button><Button size="sm" variant="outline" onClick={() => updateCookieChoice("declined")}>Decline</Button></div></div>}
      {selectedStudent && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/35 p-4" role="dialog" aria-modal="true" aria-labelledby="student-title" onClick={() => setSelectedStudent(null)}><div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Student attendance</p><h2 id="student-title" className="mt-1 text-xl font-bold">{selectedStudent.name}</h2><p className="mt-1 font-mono text-sm text-muted-foreground">{selectedStudent.roll_number}</p></div><Button variant="ghost" size="icon" aria-label="Close student details" onClick={() => setSelectedStudent(null)}><X /></Button></div><StudentSummary rows={studentHistory} /><div className="mt-6 grid gap-2">{studentHistory.length === 0 ? <EmptyState icon={<CalendarDays />} title="No records yet" description="This student has no saved attendance records." compact /> : studentHistory.map((row) => <div key={row.attendance_date} className="flex items-center justify-between rounded-xl border border-border px-3 py-3"><span>{formatDate(row.attendance_date)}</span><span className={row.is_present ? "status-present" : "status-absent"}>{row.is_present ? "Present" : "Absent"}</span></div>)}</div></div></div>}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) { return <div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><span className="text-muted-foreground">{icon}</span><p className="mt-5 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>; }
function StatCard({ label, value, tone }: { label: string; value: number; tone: "green" | "red" | "neutral" }) { return <div className={`stat-card stat-${tone}`}><p className="text-sm font-medium">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>; }
function StudentRow({ student, isPresent, onSelect }: { student: Student; isPresent: boolean | undefined; onSelect: () => void }) { return <button type="button" className="student-row" onClick={onSelect}><span className="font-mono text-sm font-semibold text-primary">{student.roll_number}</span><span className="text-left font-medium">{student.name}</span><span className={isPresent === true ? "status-present" : isPresent === false ? "status-absent" : "status-unmarked"}>{isPresent === true ? "Present" : isPresent === false ? "Absent" : "Not marked"}</span></button>; }
function StudentSummary({ rows }: { rows: AttendanceRow[] }) { const present = rows.filter((row) => row.is_present).length; const percentage = rows.length ? ((present / rows.length) * 100).toFixed(2) : "0.00"; return <div className="mt-6 grid grid-cols-3 gap-2"><div className="mini-stat"><b>{present}</b><span>Present</span></div><div className="mini-stat"><b>{rows.length - present}</b><span>Absent</span></div><div className="mini-stat"><b>{percentage}%</b><span>Overall</span></div></div>; }
function LoadingRows() { return <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card p-5"><div className="skeleton h-4 w-1/3" /><div className="mt-5 grid gap-4">{[1, 2, 3, 4, 5].map((row) => <div key={row} className="flex gap-4"><div className="skeleton h-5 w-28" /><div className="skeleton h-5 flex-1" /><div className="skeleton h-5 w-20" /></div>)}</div></div>; }
function EmptyState({ icon, title, description, compact = false }: { icon: React.ReactNode; title: string; description: string; compact?: boolean }) { return <div className={`grid place-items-center text-center ${compact ? "p-8" : "rounded-2xl border border-dashed border-border p-12"}`}><span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p></div>; }