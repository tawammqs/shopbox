
CREATE TYPE public.question_status AS ENUM ('pending', 'answered', 'hidden');

CREATE TABLE public.product_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_whatsapp text,
  question text NOT NULL,
  answer text,
  answered_at timestamptz,
  status public.question_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_questions TO authenticated;
GRANT SELECT, INSERT ON public.product_questions TO anon;
GRANT ALL ON public.product_questions TO service_role;

ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view answered questions" ON public.product_questions
  FOR SELECT
  USING (status = 'answered' OR is_store_owner(store_id_from_product(product_id)) OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Visitor submits question" ON public.product_questions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending' AND length(trim(customer_name)) >= 2 AND length(trim(question)) >= 3 AND answer IS NULL);

CREATE POLICY "Owner updates questions" ON public.product_questions
  FOR UPDATE
  USING (is_store_owner(store_id_from_product(product_id)) OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Owner deletes questions" ON public.product_questions
  FOR DELETE
  USING (is_store_owner(store_id_from_product(product_id)) OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE TRIGGER update_product_questions_updated_at
  BEFORE UPDATE ON public.product_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX product_questions_product_idx ON public.product_questions(product_id);
CREATE INDEX product_questions_status_idx ON public.product_questions(status);
