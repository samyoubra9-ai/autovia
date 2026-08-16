-- Ajoute les catégories manquantes du catalogue national (A1, A, B, D, C1, C, BE, C1E, CE, DE)
INSERT INTO categories_permis (
  id,
  auto_ecole_id,
  code,
  libelle_fr,
  libelle_ar,
  places_liste,
  sur_liste_examen,
  prix_permis,
  ordre,
  actif
)
SELECT
  'cat_' || ae.id || '_' || lower(v.code),
  ae.id,
  v.code,
  v.libelle_fr,
  v.libelle_ar,
  v.places_liste,
  true,
  25000,
  v.ordre,
  true
FROM auto_ecoles ae
CROSS JOIN (
  VALUES
    ('A1', 'Catégorie A1', 'صنف أ1', 10, 1),
    ('A', 'Catégorie A', 'صنف أ', 10, 2),
    ('B', 'Catégorie B', 'صنف ب', 15, 3),
    ('D', 'Catégorie D', 'صنف د', 10, 4),
    ('C1', 'Catégorie C1', 'صنف ج1', 10, 5),
    ('C', 'Catégorie C', 'صنف ج', 10, 6),
    ('BE', 'Catégorie BE', 'صنف ب ه', 10, 7),
    ('C1E', 'Catégorie C1E', 'صنف ج1 ه', 10, 8),
    ('CE', 'Catégorie CE', 'صنف ج ه', 10, 9),
    ('DE', 'Catégorie DE', 'صنف د ه', 10, 10)
) AS v(code, libelle_fr, libelle_ar, places_liste, ordre)
ON CONFLICT (auto_ecole_id, code) DO NOTHING;
