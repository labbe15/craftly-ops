import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  generateFEC,
  generateFECFilename,
  downloadFECFile,
  isValidSIREN,
} from "@/services/fec-export.service";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Exports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [siren, setSiren] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Récupérer le SIREN depuis les paramètres de l'organisation
  const { data: orgSettings } = useQuery({
    queryKey: ["orgSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_settings")
        .select("vat_number")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Pré-remplir le SIREN à partir du numéro de TVA
  useState(() => {
    if (orgSettings?.vat_number) {
      // Extraire le SIREN du numéro de TVA (format FR + 2 chiffres + 9 chiffres SIREN)
      const tvaParts = orgSettings.vat_number.match(/FR(\d{2})(\d{9})/);
      if (tvaParts && tvaParts[2]) {
        setSiren(tvaParts[2]);
      }
    }
  });

  const handleExportFEC = async () => {
    // Validation des champs
    if (!startDate || !endDate) {
      toast.error("Veuillez sélectionner une période");
      return;
    }

    if (!siren.trim()) {
      toast.error("Veuillez saisir le SIREN de votre entreprise");
      return;
    }

    if (!isValidSIREN(siren)) {
      toast.error("Le SIREN doit contenir exactement 9 chiffres");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      toast.error("La date de début doit être antérieure à la date de fin");
      return;
    }

    setIsExporting(true);

    try {
      // Générer le FEC
      const fecContent = await generateFEC({
        startDate: start,
        endDate: end,
        siren: siren.replace(/\s/g, ""),
      });

      // Générer le nom du fichier
      const filename = generateFECFilename(siren.replace(/\s/g, ""), end);

      // Télécharger le fichier
      downloadFECFile(fecContent, filename);

      toast.success("Export FEC téléchargé avec succès");
    } catch (error) {
      console.error("Error exporting FEC:", error);
      toast.error("Erreur lors de la génération de l'export FEC");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Exports comptables</h1>
        <p className="text-muted-foreground mt-2">
          Générez vos exports au format FEC pour votre expert-comptable
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Export FEC (Fichier des Écritures Comptables)</CardTitle>
          </div>
          <CardDescription>
            Format standardisé imposé par l'administration fiscale française pour la
            transmission des écritures comptables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siren">SIREN de votre entreprise *</Label>
              <Input
                id="siren"
                value={siren}
                onChange={(e) => setSiren(e.target.value)}
                placeholder="123456789 (9 chiffres)"
                maxLength={9}
              />
              <p className="text-xs text-muted-foreground">
                Le SIREN est utilisé pour nommer le fichier selon la norme (
                <code>SIRENFECyyyyMMdd.txt</code>)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-blue-900">À propos du format FEC</p>
              <p className="text-blue-700">
                Le fichier généré contient toutes les factures de vente de la période
                sélectionnée, au format texte avec séparateur pipe (|). Ce fichier peut
                être transmis directement à votre expert-comptable ou importé dans votre
                logiciel comptable.
              </p>
              <ul className="list-disc list-inside text-blue-700 space-y-1 mt-2">
                <li>Conforme à la norme BOI-CF-IOR-60-40-20</li>
                <li>18 colonnes obligatoires</li>
                <li>Encodage UTF-8</li>
                <li>Inclut : ventes, TVA collectée, règlements</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleExportFEC}
              disabled={isExporting || !startDate || !endDate || !siren.trim()}
              size="lg"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Générer l'export FEC
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informations supplémentaires */}
      <Card>
        <CardHeader>
          <CardTitle>Informations importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Quand utiliser l'export FEC ?</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Pour transmettre vos écritures à votre expert-comptable</li>
              <li>Lors d'un contrôle fiscal (obligation légale)</li>
              <li>Pour archiver vos données comptables</li>
              <li>Pour importer dans un logiciel comptable</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Période recommandée</h4>
            <p className="text-muted-foreground">
              Générez généralement un export par exercice comptable (du 01/01 au 31/12
              pour un exercice civil). Vous pouvez aussi générer des exports mensuels ou
              trimestriels selon vos besoins.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Plan comptable utilisé</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong>411xxx</strong> : Comptes clients
              </li>
              <li>
                <strong>706000</strong> : Prestations de services
              </li>
              <li>
                <strong>445710</strong> : TVA collectée
              </li>
              <li>
                <strong>512000</strong> : Banque
              </li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Ce plan peut être ajusté par votre expert-comptable selon votre activité.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
