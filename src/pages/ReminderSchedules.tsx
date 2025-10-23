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
import { Plus, Edit, Trash2, Calendar, Clock, Mail } from "lucide-react";
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

  // Form state
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

  // Fetch org settings
  const { data: orgSettings } = useQuery({
    queryKey: ["org_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_settings")
        .select("org_id")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch schedules
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

  // Create/Update mutation
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
        const { error } = await supabase
          .from("reminder_schedules")
          .update(scheduleData)
          .eq("id", editingSchedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("reminder_schedules")
          .insert(scheduleData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        editingSchedule
          ? "Règle mise à jour avec succès"
          : "Règle créée avec succès"
      );
      queryClient.invalidateQueries({ queryKey: ["reminder_schedules"] });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Erreur : ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reminder_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Règle supprimée avec succès");
      queryClient.invalidateQueries({ queryKey: ["reminder_schedules"] });
    },
    onError: (error: any) => {
      toast.error(`Erreur : ${error.message}`);
    },
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
      case "once":
        return "Une seule fois";
      case "daily":
        return "Tous les jours";
      case "weekly":
        return "Toutes les semaines";
      case "every_n_days":
        return `Tous les ${days || 7} jours`;
      default:
        return freq;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Règles de Relances Automatiques</h1>
          <p className="text-muted-foreground">
            Configurez des relances automatiques récurrentes pour vos devis et factures
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle règle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Modifier la règle" : "Nouvelle règle de relance"}
              </DialogTitle>
              <DialogDescription>
                Configurez une règle de relance automatique qui s'exécutera selon la fréquence définie
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la règle *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Relance devis 7 jours"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quote">Devis</SelectItem>
                      <SelectItem value="invoice">Facture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="is_active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="is_active">Règle active</Label>
                </div>
              </div>

              {type === "quote" ? (
                <div className="space-y-2">
                  <Label htmlFor="days_after_sent">
                    Jours après envoi sans réponse *
                  </Label>
                  <Input
                    id="days_after_sent"
                    type="number"
                    min="1"
                    value={daysAfterSent}
                    onChange={(e) => setDaysAfterSent(e.target.value)}
                    placeholder="7"
                  />
                  <p className="text-xs text-muted-foreground">
                    Relancer les devis envoyés depuis X jours sans acceptation
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="days_after_due">
                    Jours après échéance *
                  </Label>
                  <Input
                    id="days_after_due"
                    type="number"
                    min="0"
                    value={daysAfterDue}
                    onChange={(e) => setDaysAfterDue(e.target.value)}
                    placeholder="3"
                  />
                  <p className="text-xs text-muted-foreground">
                    Relancer les factures X jours après la date d'échéance
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="frequency">Fréquence de relance *</Label>
                <Select
                  value={frequency}
                  onValueChange={(v: any) => setFrequency(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Une seule fois</SelectItem>
                    <SelectItem value="daily">Tous les jours</SelectItem>
                    <SelectItem value="weekly">Toutes les semaines</SelectItem>
                    <SelectItem value="every_n_days">Tous les X jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {frequency === "every_n_days" && (
                <div className="space-y-2">
                  <Label htmlFor="frequency_days">Nombre de jours *</Label>
                  <Input
                    id="frequency_days"
                    type="number"
                    min="1"
                    value={frequencyDays}
                    onChange={(e) => setFrequencyDays(e.target.value)}
                    placeholder="7"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="max_reminders">Nombre maximum de relances *</Label>
                <Input
                  id="max_reminders"
                  type="number"
                  min="1"
                  max="10"
                  value={maxReminders}
                  onChange={(e) => setMaxReminders(e.target.value)}
                  placeholder="3"
                />
                <p className="text-xs text-muted-foreground">
                  Arrêter automatiquement après X relances envoyées
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_subject">Sujet de l'email (optionnel)</Label>
                <Input
                  id="email_subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Relance concernant votre {{type}} {{number}}"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_body">Corps de l'email (optionnel)</Label>
                <Textarea
                  id="email_body"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={4}
                  placeholder="Bonjour,&#10;&#10;Nous nous permettons de vous relancer concernant...&#10;&#10;Variables disponibles: {{client_name}}, {{number}}, {{amount}}"
                />
                <p className="text-xs text-muted-foreground">
                  Si vide, un template par défaut sera utilisé
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setDialogOpen(false);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!name || saveMutation.isPending}
              >
                {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Comment ça fonctionne ?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            " Les règles s'exécutent automatiquement selon la fréquence définie
          </p>
          <p>
            " Chaque règle vérifie les devis/factures qui correspondent aux critères
          </p>
          <p>
            " Un email de relance est envoyé automatiquement aux clients concernés
          </p>
          <p>
            " Le système arrête après le nombre maximum de relances configuré
          </p>
          <p className="font-medium pt-2">
              Nécessite la configuration d'une Edge Function Supabase pour l'exécution automatique
          </p>
        </CardContent>
      </Card>

      {/* Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle>Règles configurées</CardTitle>
          <CardDescription>
            {schedules?.length || 0} règle(s) de relance automatique
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : schedules && schedules.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Fréquence</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.name}</TableCell>
                    <TableCell>
                      <Badge variant={schedule.type === "quote" ? "outline" : "secondary"}>
                        {schedule.type === "quote" ? "Devis" : "Facture"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {schedule.type === "quote"
                        ? `Après ${schedule.days_after_sent} jours`
                        : `${schedule.days_after_due} jours après échéance`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getFrequencyLabel(schedule.frequency, schedule.frequency_days)}
                    </TableCell>
                    <TableCell>{schedule.max_reminders}x</TableCell>
                    <TableCell>
                      <Badge variant={schedule.is_active ? "default" : "secondary"}>
                        {schedule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer la règle</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer la règle "{schedule.name}" ?
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(schedule.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                Aucune règle configurée pour le moment
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une règle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
