-- Trigger to create event when quote is accepted
CREATE OR REPLACE FUNCTION public.handle_quote_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO public.events (
      org_id,
      client_id,
      quote_id,
      title,
      start_at,
      end_at,
      notes
    ) VALUES (
      NEW.org_id,
      NEW.client_id,
      NEW.id,
      'Début de chantier - Devis ' || NEW.number,
      CURRENT_DATE + INTERVAL '1 day', -- Default to tomorrow
      CURRENT_DATE + INTERVAL '1 day' + INTERVAL '1 hour',
      'Événement généré automatiquement suite à la validation du devis.'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_quote_accepted ON public.quotes;
CREATE TRIGGER on_quote_accepted
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_quote_accepted();
