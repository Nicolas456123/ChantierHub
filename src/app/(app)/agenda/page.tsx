"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
  Clock,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  attendees: string;
  color: string;
  author: string;
  createdAt: string;
}

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function AgendaPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchAppointments = useCallback(async () => {
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
      const res = await fetch(`/api/appointments?month=${monthStr}`);
      if (res.ok) {
        setAppointments(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    setLoading(true);
    fetchAppointments();
  }, [fetchAppointments]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  }

  function goToday() {
    setCurrentDate(new Date());
    setSelectedDate(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce rendez-vous ?")) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Rendez-vous supprimé");
        fetchAppointments();
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDay.getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  function getAppointmentsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.filter((a) => a.date.startsWith(dateStr));
  }

  const selectedDateStr = selectedDate;
  const selectedAppointments = selectedDate
    ? appointments.filter((a) => a.date.startsWith(selectedDate))
    : [];

  // Also show upcoming in next 7 days if no date selected
  const upcomingAppointments = !selectedDate
    ? appointments
        .filter((a) => new Date(a.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Rendez-vous et événements du projet"
        action={
          <Link href="/agenda/nouveau">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau rendez-vous
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold min-w-[180px] text-center">
                  {MONTHS_FR[month]} {year}
                </h2>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToday}>
                Aujourd&apos;hui
              </Button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_FR.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="h-20 border border-gray-50" />;
                }

                const dayAppts = getAppointmentsForDay(day);
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = selectedDateStr === dateStr;

                return (
                  <div
                    key={day}
                    className={`h-20 border border-gray-100 p-1 cursor-pointer transition-colors hover:bg-gray-50 ${
                      isSelected ? "bg-orange-50 ring-1 ring-orange-300" : ""
                    } ${isToday(day) ? "bg-orange-50/50" : ""}`}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${
                          isToday(day)
                            ? "bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                            : "text-gray-700"
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                    <div className="mt-0.5 space-y-0.5 overflow-hidden">
                      {dayAppts.slice(0, 2).map((a) => (
                        <div
                          key={a.id}
                          className="text-[10px] leading-tight truncate rounded px-1 py-0.5 text-white"
                          style={{ backgroundColor: a.color }}
                        >
                          {a.title}
                        </div>
                      ))}
                      {dayAppts.length > 2 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{dayAppts.length - 2} de plus
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          {selectedDate ? (
            <>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              {selectedAppointments.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun rendez-vous ce jour</p>
                  </CardContent>
                </Card>
              ) : (
                selectedAppointments.map((appt) => (
                  <AppointmentCard key={appt.id} appointment={appt} onDelete={handleDelete} />
                ))
              )}
            </>
          ) : (
            <>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                À venir
              </h3>
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : upcomingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun rendez-vous à venir</p>
                  </CardContent>
                </Card>
              ) : (
                upcomingAppointments.map((appt) => (
                  <AppointmentCard key={appt.id} appointment={appt} onDelete={handleDelete} />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AppointmentCard({
  appointment,
  onDelete,
}: {
  appointment: Appointment;
  onDelete: (id: string) => void;
}) {
  const attendees = (() => {
    try {
      return JSON.parse(appointment.attendees) as string[];
    } catch {
      return [];
    }
  })();

  return (
    <Card className="border-l-4" style={{ borderLeftColor: appointment.color }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm">{appointment.title}</h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-red-600"
            onClick={() => onDelete(appointment.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {appointment.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {appointment.description}
          </p>
        )}
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDateTime(appointment.date)}
            {appointment.endDate && ` → ${formatDateTime(appointment.endDate)}`}
          </div>
          {appointment.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {appointment.location}
            </div>
          )}
          {attendees.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {attendees.join(", ")}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-[10px]">
            {appointment.author}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
