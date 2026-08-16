-- LocalAutovia / Autovia — seed apprentissage chapitre 1
-- Exécuter après docs/sql/learning-content.sql
-- npx supabase db query --file docs/sql/learning-chapitre-1-seed.sql

INSERT INTO learning_modules (id, slug, step, title_fr, subtitle_fr, description_fr, published)
VALUES (
  'lm-chapitre-1',
  'chapitre-1',
  1,
  'Signalisation et règles de la circulation routière',
  'Programme officiel — permis de conduire',
  'Signalisation verticale et horizontale, règles de circulation, infractions et feux du véhicule.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title_fr = EXCLUDED.title_fr,
  subtitle_fr = EXCLUDED.subtitle_fr,
  description_fr = EXCLUDED.description_fr,
  step = EXCLUDED.step;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-1-1-panneaux-danger',
  'lm-chapitre-1',
  '1-1-panneaux-danger',
  1,
  'Panneaux de danger',
  'Forme, couleurs et familles de panneaux annonçant un danger.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-1-2-panneaux-interdiction',
  'lm-chapitre-1',
  '1-2-panneaux-interdiction',
  2,
  'Panneaux d''interdiction et de fin d''interdiction',
  'Interdictions, restrictions et levée d''interdiction.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-1-3-panneaux-obligation',
  'lm-chapitre-1',
  '1-3-panneaux-obligation',
  3,
  'Panneaux d''obligation et de fin d''obligation',
  'Obligations imposées au conducteur et fin d''obligation.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-1-4-panneaux-indication',
  'lm-chapitre-1',
  '1-4-panneaux-indication',
  4,
  'Panneaux d''indication et de direction',
  'Informations utiles, services et directions.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-1-5-panneaux-priorite',
  'lm-chapitre-1',
  '1-5-panneaux-priorite',
  5,
  'Panneaux de priorité',
  'Stop, cédez le passage, route prioritaire.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-1-6-panonces',
  'lm-chapitre-1',
  '1-6-panonces',
  6,
  'Panonceaux',
  'Compléments d''information sur les panneaux principaux.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-1-7-balises-bornes',
  'lm-chapitre-1',
  '1-7-balises-bornes',
  7,
  'Balises et bornes kilométriques',
  'Guidage, délimitation et repères kilométriques.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-1-8-feux-tricolores',
  'lm-chapitre-1',
  '1-8-feux-tricolores',
  8,
  'Feux tricolores',
  'Feux rouge, orange et vert ; flèches et signaux associés.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-1-9-agents-circulation',
  'lm-chapitre-1',
  '1-9-agents-circulation',
  9,
  'Agents de la circulation routière',
  'Police, gendarmerie et signaux manuels des agents.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-2-1-lignes',
  'lm-chapitre-1',
  '2-1-lignes',
  10,
  'Lignes',
  'Lignes continues, discontinues, doubles et leur signification.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-2-2-fleches',
  'lm-chapitre-1',
  '2-2-fleches',
  11,
  'Flèches',
  'Flèches de direction, de sélection et de changement de voie.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-2-3-voies-specialisees',
  'lm-chapitre-1',
  '2-3-voies-specialisees',
  12,
  'Voies spécialisées',
  'Voies bus, cycles, piétons et autres affectations.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-2-4-autres-marques',
  'lm-chapitre-1',
  '2-4-autres-marques',
  13,
  'Autres marques',
  'Passages piétons, dos d''âne, zones hachurées et marquages divers.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-3-1-signalisation-temporaire-verticale',
  'lm-chapitre-1',
  '3-1-signalisation-temporaire-verticale',
  14,
  'Signalisation temporaire verticale',
  'Panneaux et dispositifs lors de travaux ou d''événements.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-3-2-signalisation-temporaire-horizontale',
  'lm-chapitre-1',
  '3-2-signalisation-temporaire-horizontale',
  15,
  'Signalisation temporaire horizontale',
  'Marquage provisoire au sol et déviations.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-4-1-regles-administratives',
  'lm-chapitre-1',
  '4-1-regles-administratives',
  16,
  'Règles administratives pour les véhicules et les conducteurs',
  'Documents, contrôles et obligations légales.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-4-2-positionnement',
  'lm-chapitre-1',
  '4-2-positionnement',
  17,
  'Positionnement',
  'Placement du véhicule sur la chaussée et en chaussée.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-4-3-croisement',
  'lm-chapitre-1',
  '4-3-croisement',
  18,
  'Croisement',
  'Règles de croisement et dégagements latéraux.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-4-4-depassement',
  'lm-chapitre-1',
  '4-4-depassement',
  19,
  'Dépassement',
  'Conditions, interdictions et bonnes pratiques de dépassement.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-4-5-priorite-passage',
  'lm-chapitre-1',
  '4-5-priorite-passage',
  20,
  'Priorité de passage',
  'Priorités aux intersections, ronds-points et passages.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-4-6-vitesse',
  'lm-chapitre-1',
  '4-6-vitesse',
  21,
  'Vitesse',
  'Limitations, adaptation et distances de sécurité.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-4-7-charge-vehicules',
  'lm-chapitre-1',
  '4-7-charge-vehicules',
  22,
  'Charge et ensemble des véhicules',
  'Chargement, remorques et gabarits.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-4-8-conduite-nuit',
  'lm-chapitre-1',
  '4-8-conduite-nuit',
  23,
  'Conduite de nuit',
  'Éclairage, visibilité et vigilance nocturne.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-4-9-conduite-mauvais-temps',
  'lm-chapitre-1',
  '4-9-conduite-mauvais-temps',
  24,
  'Conduite par mauvais temps',
  'Pluie, brouillard, vent et chaussée glissante.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-4-10-arret-stationnement',
  'lm-chapitre-1',
  '4-10-arret-stationnement',
  25,
  'Arrêt et stationnement',
  'Différences, interdictions et règles de stationnement.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-5-1-contraventions',
  'lm-chapitre-1',
  '5-1-contraventions',
  26,
  'Contraventions',
  'Infractions mineures, amendes et retrait de points.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-5-2-delits',
  'lm-chapitre-1',
  '5-2-delits',
  27,
  'Délits',
  'Infractions graves et sanctions pénales.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-6-1-feux-avant',
  'lm-chapitre-1',
  '6-1-feux-avant',
  28,
  'Feux avant',
  'Code, route, antibrouillard et feux de jour.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

INSERT INTO learning_chapters (id, module_id, slug, sort_order, title_fr, summary_fr, body_fr, published)
VALUES (
  'lc-6-2-feux-arriere',
  'lm-chapitre-1',
  '6-2-feux-arriere',
  29,
  'Feux arrière',
  'Feux de position, stop, recul et plaque.',
  '<p>Contenu en cours de rédaction.</p>',
  true
)
ON CONFLICT (module_id, slug) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  title_fr = EXCLUDED.title_fr,
  summary_fr = EXCLUDED.summary_fr;

SELECT COUNT(*)::int AS lecons_chapitre_1 FROM learning_chapters WHERE module_id = 'lm-chapitre-1';
