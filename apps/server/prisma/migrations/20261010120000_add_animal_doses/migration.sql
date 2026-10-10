-- Preserve existing animals; no dose history can be inferred from summary flags.
ALTER TABLE "tb_animals"
  ADD COLUMN "v10Doses" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "vacinaRaivaDoses" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "vermifugoDoses" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "tb_animals"
  ADD CONSTRAINT "tb_animals_doses_arrays" CHECK (
    jsonb_typeof("v10Doses") = 'array' AND
    jsonb_typeof("vacinaRaivaDoses") = 'array' AND
    jsonb_typeof("vermifugoDoses") = 'array'
  );
