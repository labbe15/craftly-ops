import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// STOP : PLUS D'ICONES LUCIDE ICI
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ReminderSchedule {
  id: string;
  org_id: string;
  name: string;
  type: "quote" | "invoice";
  is_active: boolean;
  days_after_sent?: number;
  days_after_due?: number;
  frequency: "once" | "daily" | "weekly" | "every_n_days";
  frequency_days?: number;
  max_reminders: number;
  email_subject?: string;
  email_body?: string;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
}

export default function ReminderSchedules() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ReminderSchedule | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<"quote" | "invoice">("quote");
  const [isActive, setIsActive] = useState(true);
  const [daysAfterSent, setDaysAfterSent] = useState("7");
  const [daysAfterDue, setDaysAfterDue] = useState("3");
  const [frequency, setFrequency] = useState<"once" | "daily" | "weekly" | "every_n_days">("every_n_days");
  const [frequencyDays, setFrequencyDays] = useState("7");
  const [maxReminders, setMaxReminders] = useState("3");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const { data: orgSettings } = useQuery({
    queryKey: ["org_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("org_settings").select("org_id").limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["reminder_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminder_schedules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ReminderSchedule[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgSettings?.org_id) throw new Error("Org ID not found");
      const scheduleData = {
        org_id: orgSettings.org_id,
        name,
        type,
        is_active: isActive,
        days_after_sent: type === "quote" ? parseInt(daysAfterSent) : null,
        days_after_due: type === "invoice" ? parseInt(daysAfterDue) : null,
        frequency,
        frequency_days: frequency === "every_n_days" ? parseInt(frequencyDays) : null,
        max_reminders: parseInt(maxReminders),
        email_subject: emailSubject || null,
        email_body: emailBody || null,
      };

      if (editingSchedule) {
        const { error } = await supabase.from("reminder_schedules").update(scheduleData).eq("id", editingSchedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reminder_schedules").insert(scheduleData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingSchedule ? "Règle mise à jour" : "Règle créée");
      queryClient.invalidateQueries({ queryKey: ["reminder_schedules"] });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: any) => toast.error(`Erreur : ${error.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminder_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Règle supprimée");
      queryClient.invalidateQueries({ queryKey: ["reminder_schedules"] });
    },
    onError: (error: any) => toast.error(`Erreur : ${error.message}`),
  });

  const resetForm = () => {
    setName("");
    setType("quote");
    setIsActive(true);
    setDaysAfterSent("7");
    setDaysAfterDue("3");
    setFrequency("every_n_days");
    setFrequencyDays("7");
    setMaxReminders("3");
    setEmailSubject("");
    setEmailBody("");
    setEditingSchedule(null);
  };

  const openEditDialog = (schedule: ReminderSchedule) => {
    setEditingSchedule(schedule);
    setName(schedule.name);
    setType(schedule.type);
    setIsActive(schedule.is_active);
    setDaysAfterSent(schedule.days_after_sent?.toString() || "7");
    setDaysAfterDue(schedule.days_after_due?.toString() || "3");
    setFrequency(schedule.frequency);
    setFrequencyDays(schedule.frequency_days?.toString() || "7");
    setMaxReminders(schedule.max_reminders.toString());
    setEmailSubject(schedule.email_subject || "");
    setEmailBody(schedule.email_body || "");
    setDialogOpen(true);
  };

  const getFrequencyLabel = (freq: string, days?: number) => {
    switch (freq) {
      case "once": return "Une seule fois";
      case "daily": return "Tous les jours";
      case "weekly": return "Toutes les semaines";
      case "every_n_days": return `Tous les ${days || 7} jours`;
      default: return freq;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Règles de Relances</h1>
          <p className="text-muted-foreground">Gestion des relances automatiques</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <span className="mr-2 font-bold">+</span> Nouvelle règle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSchedule ? "Modifier" : "Nouvelle règle"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de la règle" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quote">Devis</SelectItem>
                      <SelectItem value="invoice">Facture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label>Active</Label>
                </div>
              </div>
              
              {type === "quote" ? (
                <div className="space-y-2">
                  <Label>Jours après envoi</Label>
                  <Input type="number" value={daysAfterSent} onChange={(e) => setDaysAfterSent(e.target.value)} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Jours après échéance</Label>
                  <Input type="number" value={daysAfterDue} onChange={(e) => setDaysAfterDue(e.target.value)} />
                </div>
              )}

              <div className="space-y-2">
                <Label>Fréquence</Label>
                <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Une fois</SelectItem>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdo</SelectItem>
                    <SelectItem value="every_n_days">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {frequency === "every_n_days" && (
                <div className="space-y-2">
                   <Label>Intervalle (jours)</Label>
                   <Input type="number" value={frequencyDays} onChange={(e) => setFrequencyDays(e.target.value)} />
                </div>
              )}

              <div className="space-y-2">
                <Label>Max relances</Label>
                <Input type="number" value={maxReminders} onChange={(e) => setMaxReminders(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sujet Email</Label>
                <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!name}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-lg">Fonctionnement</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800">
           <ul className="list-disc pl-4">
             <li>Exécution automatique selon la fréquence.</li>
             <li>Envoi d'email aux clients concernés.</li>
             <li>Arrêt après le nombre max de relances.</li>
           </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Règles ({schedules?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p>Chargement...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Détail</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules?.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.name}</TableCell>
                    <TableCell><Badge variant="outline">{schedule.type === "quote" ? "Devis" : "Facture"}</Badge></TableCell>
                    <TableCell className="text-sm">{getFrequencyLabel(schedule.frequency, schedule.frequency_days)}</TableCell>
                    <TableCell>
                      <Badge variant={schedule.is_active ? "default" : "secondary"}>
                        {schedule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(schedule)}>Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">Suppr</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer ?</AlertDialogTitle>
                              <AlertDialogDescription>Irréversible.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Non</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(schedule.id)}>Oui</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
