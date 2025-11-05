import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface SignatureDisplayProps {
  signatureUrl: string;
  signedAt: string;
  signedByName?: string;
  signedByEmail?: string;
}

export function SignatureDisplay({
  signatureUrl,
  signedAt,
  signedByName,
  signedByEmail,
}: SignatureDisplayProps) {
  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          Devis signé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-4 rounded-md border">
          <img
            src={signatureUrl}
            alt="Signature"
            className="max-w-full h-auto max-h-32 mx-auto"
          />
        </div>
        <div className="text-sm space-y-1">
          {signedByName && (
            <p>
              <span className="font-medium">Signé par :</span> {signedByName}
            </p>
          )}
          {signedByEmail && (
            <p>
              <span className="font-medium">Email :</span> {signedByEmail}
            </p>
          )}
          <p>
            <span className="font-medium">Date :</span>{" "}
            {format(new Date(signedAt), "dd/MM/yyyy 'à' HH:mm")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
