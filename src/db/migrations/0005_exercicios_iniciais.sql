-- Catálogo inicial de exercícios (treinos.md, decisão 16) nas contas que já
-- existiam. As contas novas recebem a mesma lista no cadastro
-- (EXERCICIOS_INICIAIS). Um nome que a conta já tem fica como está.
INSERT INTO "exercicio" ("usuario_id", "nome", "nome_normalizado")
SELECT u."id", e."nome", e."nome_normalizado"
FROM "usuario" u
CROSS JOIN (VALUES
  ('Supino reto', 'supino reto'),
  ('Supino inclinado', 'supino inclinado'),
  ('Supino declinado', 'supino declinado'),
  ('Crucifixo', 'crucifixo'),
  ('Crossover', 'crossover'),
  ('Flexão', 'flexao'),
  ('Puxada frontal', 'puxada frontal'),
  ('Barra fixa', 'barra fixa'),
  ('Remada curvada', 'remada curvada'),
  ('Remada baixa', 'remada baixa'),
  ('Remada unilateral', 'remada unilateral'),
  ('Levantamento terra', 'levantamento terra'),
  ('Desenvolvimento', 'desenvolvimento'),
  ('Elevação lateral', 'elevacao lateral'),
  ('Elevação frontal', 'elevacao frontal'),
  ('Crucifixo inverso', 'crucifixo inverso'),
  ('Rosca direta', 'rosca direta'),
  ('Rosca alternada', 'rosca alternada'),
  ('Rosca martelo', 'rosca martelo'),
  ('Rosca Scott', 'rosca scott'),
  ('Tríceps pulley', 'triceps pulley'),
  ('Tríceps testa', 'triceps testa'),
  ('Tríceps francês', 'triceps frances'),
  ('Paralelas', 'paralelas'),
  ('Agachamento livre', 'agachamento livre'),
  ('Leg press', 'leg press'),
  ('Cadeira extensora', 'cadeira extensora'),
  ('Mesa flexora', 'mesa flexora'),
  ('Stiff', 'stiff'),
  ('Afundo', 'afundo'),
  ('Elevação pélvica', 'elevacao pelvica'),
  ('Cadeira abdutora', 'cadeira abdutora'),
  ('Panturrilha em pé', 'panturrilha em pe'),
  ('Abdominal', 'abdominal'),
  ('Abdominal infra', 'abdominal infra')
) AS e("nome", "nome_normalizado")
ON CONFLICT ("usuario_id", "nome_normalizado") DO NOTHING;
