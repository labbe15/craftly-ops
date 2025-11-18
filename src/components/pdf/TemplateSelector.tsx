import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, FileText } from "lucide-react";
import { getTemplatesByType, TemplateMetadata } from "./templates";

interface TemplateSelectorProps {
  type: "quote" | "invoice";
  selectedTemplateId?: string;
  onSelect: (templateId: string) => void;
}

export function TemplateSelector({ type, selectedTemplateId, onSelect }: TemplateSelectorProps) {
  const templates = getTemplatesByType(type);
  const [selected, setSelected] = useState(selectedTemplateId || templates[0].id);

  const handleSelect = (templateId: string) => {
    setSelected(templateId);
    onSelect(templateId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Choisir un template PDF
        </CardTitle>
        <CardDescription>
          Sélectionnez le design pour vos {type === "quote" ? "devis" : "factures"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selected} onValueChange={handleSelect} className="gap-4">
          {templates.map((template) => (
            <div key={template.id} className="relative">
              <RadioGroupItem
                value={template.id}
                id={template.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={template.id}
                className="flex flex-col gap-3 cursor-pointer rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-base">{template.name}</span>
                      {selected === template.id && (
                        <Badge variant="default" className="h-5">
                          <Check className="h-3 w-3 mr-1" />
                          Sélectionné
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                </div>

                {/* Preview placeholder */}
                <div className="relative bg-muted/30 rounded-md h-32 flex items-center justify-center border border-border/50">
                  <div className="text-center space-y-2">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">
                      Aperçu du template {template.name}
                    </p>
                  </div>
                </div>

                {/* Style indicators */}
                <div className="flex gap-2">
                  {template.id.includes("modern") && (
                    <Badge variant="secondary" className="text-xs">Couleurs</Badge>
                  )}
                  {template.id.includes("classic") && (
                    <Badge variant="secondary" className="text-xs">Traditionnel</Badge>
                  )}
                  {template.id.includes("minimal") && (
                    <Badge variant="secondary" className="text-xs">Épuré</Badge>
                  )}
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
          <p className="text-sm text-muted-foreground">
            <strong>Astuce :</strong> Le template sélectionné sera utilisé par défaut pour tous les nouveaux{" "}
            {type === "quote" ? "devis" : "factures"}. Vous pourrez toujours le changer individuellement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
