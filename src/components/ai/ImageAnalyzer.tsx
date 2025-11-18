import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Camera, FileText, Loader2, Eye, AlertTriangle, Package, Shield, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { openaiService } from "@/services/openai.service";

interface ImageAnalyzerProps {
  mode: "construction" | "document";
  onDataExtracted?: (data: any) => void;
}

export function ImageAnalyzer({ mode, onDataExtracted }: ImageAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [analysisType, setAnalysisType] = useState<string>(
    mode === "construction" ? "progress" : "invoice"
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    // Validate file size (max 10MB for Vision API)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 10 Mo");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      // Remove data:image/...;base64, prefix
      const base64Data = base64.split(",")[1];
      setSelectedImage(base64Data);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error("Veuillez d'abord sélectionner une image");
      return;
    }

    if (!openaiService.isConfigured()) {
      toast.error("Clé API OpenAI non configurée");
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      let analysisResult;

      if (mode === "construction") {
        analysisResult = await openaiService.analyzeConstructionPhoto(
          selectedImage,
          analysisType as "progress" | "defects" | "materials" | "safety"
        );
      } else {
        analysisResult = await openaiService.extractDataFromDocument(
          selectedImage,
          analysisType as "invoice" | "receipt" | "estimate"
        );
      }

      setResult(analysisResult);

      if (mode === "document" && analysisResult.data && onDataExtracted) {
        onDataExtracted(analysisResult.data);
      }

      toast.success("Analyse terminée !");
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast.error(`Erreur d'analyse : ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const renderConstructionTabs = () => (
    <TabsList className="grid w-full grid-cols-4">
      <TabsTrigger value="progress" onClick={() => setAnalysisType("progress")}>
        <Eye className="h-4 w-4 mr-2" />
        Avancement
      </TabsTrigger>
      <TabsTrigger value="defects" onClick={() => setAnalysisType("defects")}>
        <AlertTriangle className="h-4 w-4 mr-2" />
        Défauts
      </TabsTrigger>
      <TabsTrigger value="materials" onClick={() => setAnalysisType("materials")}>
        <Package className="h-4 w-4 mr-2" />
        Matériaux
      </TabsTrigger>
      <TabsTrigger value="safety" onClick={() => setAnalysisType("safety")}>
        <Shield className="h-4 w-4 mr-2" />
        Sécurité
      </TabsTrigger>
    </TabsList>
  );

  const renderDocumentTabs = () => (
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="invoice" onClick={() => setAnalysisType("invoice")}>
        <FileText className="h-4 w-4 mr-2" />
        Facture
      </TabsTrigger>
      <TabsTrigger value="receipt" onClick={() => setAnalysisType("receipt")}>
        <FileText className="h-4 w-4 mr-2" />
        Reçu
      </TabsTrigger>
      <TabsTrigger value="estimate" onClick={() => setAnalysisType("estimate")}>
        <FileText className="h-4 w-4 mr-2" />
        Devis
      </TabsTrigger>
    </TabsList>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {mode === "construction" ? "Analyse de photo de chantier" : "OCR Document"}
        </CardTitle>
        <CardDescription>
          {mode === "construction"
            ? "Uploadez une photo pour analyser l'avancement, détecter des défauts, ou identifier les matériaux"
            : "Uploadez une image de facture, reçu ou devis pour extraction automatique des données"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Type Tabs */}
        <Tabs defaultValue={analysisType} className="w-full">
          {mode === "construction" ? renderConstructionTabs() : renderDocumentTabs()}

          <TabsContent value={analysisType} className="space-y-4 mt-4">
            {/* Image Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Choisir une image
                    </span>
                  </Button>
                </label>

                {selectedImage && (
                  <Button onClick={handleAnalyze} disabled={analyzing}>
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Analyser l'image
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Image Preview */}
              {selectedImage && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <img
                        src={`data:image/jpeg;base64,${selectedImage}`}
                        alt="Image sélectionnée"
                        className="max-w-full max-h-96 rounded-lg object-contain mx-auto"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="border rounded-lg p-6 bg-muted/30 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-lg">Résultat de l'analyse</h3>
                    <Badge variant="outline" className="ml-auto">
                      {result.tokens} tokens
                    </Badge>
                  </div>

                  {mode === "construction" ? (
                    // Construction analysis result
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {result.analysis}
                      </div>
                    </div>
                  ) : (
                    // Document OCR result
                    <div className="space-y-4">
                      {result.data ? (
                        <div className="bg-background rounded-lg p-4 border">
                          <h4 className="font-medium mb-3">Données extraites :</h4>
                          <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Aucune donnée structurée extraite. Réponse brute :
                          <div className="mt-2 whitespace-pre-wrap">{result.raw}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Astuce :</strong> Pour de meilleurs résultats, assurez-vous que l'image est nette et bien éclairée.
            {mode === "document" && " Les documents doivent être lisibles et complets."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
