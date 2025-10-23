# Process Reminders - Supabase Edge Function

Cette fonction Edge traite automatiquement les relances configur�es dans le syst�me.

## Fonctionnement

1. **R�cup�re toutes les r�gles actives** dans `reminder_schedules`
2. **Pour chaque r�gle**, cherche les devis/factures correspondants aux crit�res
3. **Envoie les emails** de relance (via mail_log)
4. **Enregistre** les envois dans `reminder_logs`
5. **Respecte** le nombre maximum de relances configur�
6. **Calcule** la prochaine ex�cution selon la fr�quence

## D�ploiement

### 1. D�ployer la fonction

```bash
supabase functions deploy process-reminders
```

### 2. Configurer le Cron Job

Pour ex�cuter automatiquement cette fonction, configurez un cron job Supabase :

#### Via Supabase Dashboard:
1. Allez dans **Database** > **Cron Jobs**
2. Cr�ez un nouveau cron job :
   - **Name**: `process-reminders-daily`
   - **Schedule**: `0 9 * * *` (tous les jours � 9h00 UTC)
   - **Command**:
   ```sql
   SELECT
     net.http_post(
       url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-reminders',
       headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
     ) as request_id;
   ```

#### Via Migration SQL:
Cr�ez un fichier de migration :

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the reminder processing job to run daily at 9 AM UTC
SELECT cron.schedule(
  'process-reminders-daily',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) as request_id;
  $$
);
```

### 3. Fr�quences cron utiles

- Tous les jours � 9h: `0 9 * * *`
- Toutes les heures: `0 * * * *`
- Deux fois par jour (9h et 18h): `0 9,18 * * *`
- Tous les lundis � 9h: `0 9 * * 1`

## Test manuel

### En local (avec Supabase CLI):

```bash
supabase functions serve process-reminders
```

Puis dans un autre terminal :

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-reminders' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

### En production:

```bash
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-reminders' \
  --header 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  --header 'Content-Type: application/json'
```

## Logs et Monitoring

### Voir les logs de la fonction:

```bash
supabase functions logs process-reminders
```

### Voir les cron jobs actifs:

```sql
SELECT * FROM cron.job;
```

### Voir l'historique des ex�cutions:

```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## Int�gration Email

� **Important**: Cette fonction log les emails dans `mail_log` mais **n'envoie pas r�ellement les emails**.

Pour envoyer les emails, vous devez :
1. Modifier la fonction pour appeler votre service d'email (Resend, SendGrid, etc.)
2. Ou cr�er une autre fonction Edge qui lit `mail_log` et envoie les emails

### Exemple d'int�gration avec Resend:

```typescript
// Dans processQuoteSchedule et processInvoiceSchedule, remplacer:
console.log(`Sending reminder...`)

// Par:
const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'noreply@votredomaine.com',
    to: quote.client.email,
    subject: subject,
    text: body
  })
})

const emailResult = await res.json()
console.log('Email sent:', emailResult)
```

## Variables d'environnement

Assurez-vous que ces variables sont configur�es :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- (Optionnel) `RESEND_API_KEY` ou autre service email

## D�pannage

### La fonction ne s'ex�cute pas
- V�rifiez que le cron job est actif : `SELECT * FROM cron.job WHERE jobname = 'process-reminders-daily';`
- V�rifiez les logs : `SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-reminders-daily');`

### Aucune relance envoy�e
- V�rifiez qu'il y a des r�gles actives : `SELECT * FROM reminder_schedules WHERE is_active = true;`
- V�rifiez les logs de la fonction : `supabase functions logs process-reminders`
- V�rifiez que les crit�res correspondent (dates, statuts, etc.)

### Trop de relances envoy�es
- V�rifiez `max_reminders` dans vos r�gles
- V�rifiez `reminder_logs` pour voir l'historique des envois
