# Autovia — Grille des 3 packs d'abonnement

Document de référence pour la commercialisation et l'implémentation des limites SaaS.

---

## Essai gratuit (avant tout pack)

| Élément | Limite |
|--------|--------|
| Durée | **15 jours** |
| Candidats (élèves) actifs | **10 max** |
| Moniteurs | **2 max** (recommandé) |
| Catégories de permis | **1** (ex. B) |
| Moniteur principal multi-catégories | Non |
| Listes d'examen | 1 liste de test ou mode essai (option) |
| Cartes QR candidat | Oui (volume limité possible) |
| App candidat PWA | Oui |

**Inscription en ligne** (formulaire vitrine + validation backdash) : **Essentiel, Pro et Élite** uniquement — pas en essai gratuit.

---

## Pack 1 — Essentiel

**Cible :** petite auto-école, surtout permis B, 1–2 moniteurs.

| Limite / fonctionnalité | Contenu |
|------------------------|---------|
| Candidats actifs | **90–120** (formule selon catégories, plafond 120) |
| Moniteurs | **3** (dont 1 principal, **1 catégorie** pour le principal) |
| Catégories de permis | **2 max** (ex. B + A ou B + A1) |
| Véhicules | **3** |
| Utilisateurs backdash | **1** |
| Fiches élèves & paiements | Oui |
| Planning séances | Oui |
| Listes d'examen & bordereau | Oui |
| Cartes QR candidat | Oui — **50 impressions / mois** (ou sans impression bulk) |
| Impressions bulk cartes A4 | Non (ou limité) |
| Paramètres établissement (nom FR/AR, wilaya…) | Oui |
| App candidat (QR) | Oui |
| Inscription en ligne (pré-inscriptions) | Oui |
| Notifications push candidat | Non |
| Support | E-mail standard |

**Prix public (2026) :**
- **Annuel :** 12 000 DZD / an (soit ~1 000 DZD / mois)
- **Mensuel :** 1 200 DZD / mois → 14 400 DZD / an (plus cher que l'annuel)

**Quota dossiers (implémenté) :** formule catégories avec plancher **90** et plafond **120** :
- Standard : 60 + (n−1)×20 par catégorie hors remorque
- Remorque (BE, CE, DE, C1E) : +60 chacune

---

## Pack 2 — Pro (recommandé)

**Cible :** école structurée, A + B (ou plus), plusieurs moniteurs, volume régulier.

| Limite / fonctionnalité | Contenu |
|------------------------|---------|
| Candidats actifs | **300** |
| Moniteurs | **Illimités** |
| Moniteur principal | **Oui** — **plusieurs catégories** |
| Catégories de permis | **Illimitées** |
| Véhicules | **Illimités** |
| Utilisateurs backdash | **3** (gérant, secrétaire, caisse) |
| Fiches élèves & paiements | Oui |
| Planning séances | Oui |
| Listes d'examen & bordereau | Oui — illimité |
| Cartes QR candidat | **Illimitées** |
| Impressions bulk cartes A4 | Oui |
| Paramètres établissement | Oui — complet |
| App candidat (QR) | Oui |
| Inscription en ligne (pré-inscriptions) | Oui |
| Notifications push candidat | Oui |
| Support | Prioritaire |

**Prix public (2026) :**
- **Annuel :** 20 000 DZD / an
- **Mensuel :** 2 084 DZD / mois → 25 000 DZD / an (plus cher que l'annuel)

**Quota dossiers :** **300** (fixe, indépendamment des catégories).

---

## Pack 3 — Élite

**Cible :** très grosse école, plusieurs sites ou groupe.

| Limite / fonctionnalité | Contenu |
|------------------------|---------|
| Candidats actifs | **Illimités** |
| Moniteurs | **Illimités** |
| Moniteur principal multi-catégories | **Oui** |
| Catégories de permis | **Illimitées** |
| Véhicules | **Illimités** |
| Utilisateurs backdash | **Illimités** (ou 10+) |
| Fiches élèves & paiements | Oui |
| Planning séances | Oui |
| Listes d'examen & bordereau | Oui — illimité |
| Cartes QR candidat | **Illimitées** |
| Impressions bulk cartes A4 | Oui |
| Paramètres établissement | Oui — complet |
| App candidat (QR) | Oui |
| Inscription en ligne (pré-inscriptions) | Oui |
| Notifications push candidat | Oui |
| Export / sauvegarde données | Oui (à prévoir) |
| Stats avancées | Oui (à prévoir) |
| Multi-établissements | À prévoir |
| Support | Prioritaire + accompagnement installation |

**Message commercial :** *Zéro plafond, accompagnement renforcé.*

**Prix indicatif :** 15 000 – 25 000 DZD / mois — annuel −15 à 20 %.

---

## Comparatif rapide

| Critère | Essai | Essentiel | Pro | Élite |
|---------|-------|-----------|-----|-------|
| Durée / candidats | 15 j · 10 élèves | 80 | 300 (∞) | ∞ |
| Moniteurs | 2 | 3 | ∞ | ∞ |
| Catégories permis | 1 | 2 | ∞ | ∞ |
| Principal multi-cat. | Non | 1 cat. | Oui | Oui |
| Véhicules | — | 3 | ∞ | ∞ |
| Utilisateurs | 1 | 1 | 3 | ∞ |
| Listes examen | test | Oui | Illimité | Illimité |
| Cartes QR / bulk | limité | 50/mois | Illimité | Illimité |
| Inscription en ligne | Non | Oui | Oui | Oui |
| Push candidat | — | Non | Oui | Oui |
| Prix / mois (indicatif) | 0 | 4–6 k DZD | 8–12 k DZD | 15–25 k DZD |

---

## Correspondance technique (à implémenter)

| Fonctionnalité code | Essai | Essentiel | Pro | Élite |
|---------------------|-------|-----------|-----|-------|
| `subscriptionStatus` | `TRIAL` | `ACTIVE` + plan | `ACTIVE` + plan | `ACTIVE` + plan |
| `TRIAL_MAX_ELEVES` (10) | Oui | — | — | — |
| Limite élèves API | 10 | 80 | 300 / ∞ | ∞ |
| Nombre `categories_permis` | 1 | 2 | ∞ | ∞ |
| Nombre moniteurs | 2 | 3 | ∞ | ∞ |
| `estPrincipal` + pivot catégories | Non | 1 cat. | Oui | Oui |
| Nombre véhicules | — | 3 | ∞ | ∞ |
| `hasOnlineInscriptionFeature` | Non | Oui | Oui | Oui |

Champ suggéré en base : `auto_ecoles.plan` → `ESSENTIEL` | `PRO` | `ELITE` (en plus de `subscription_status`).

---

## Paiement (phase 1)

- Virement bancaire + activation manuelle (admin plateforme ou e-mail contact).
- Facture / reçu hors ligne.
- Intégration Stripe / CIB : phase ultérieure.

Contact upgrade actuel : voir `UPGRADE_CONTACT_EMAIL` / dialog « Passer à Pro » dans le backdash.

---

## Fonctionnalité à venir — Confirmation candidat (accepter / refuser + motif)

### Idée produit

Lorsqu’une **séance** est planifiée/modifiée ou qu’une **convocation examen** est publiée (liste d’examen), le candidat reçoit :

1. **Push** (déjà en place) + entrée dans **Mon espace** candidat  
2. **Nouveau :** boutons **J’accepte** / **Je refuse** + champ **motif** (obligatoire si refus)  
3. Côté backdash : le **moniteur** (ou l’équipe) voit le statut et le motif sur la fiche élève, le planning ou la séance

### État actuel dans le code

| Élément | Aujourd’hui |
|--------|-------------|
| Push séance / examen / paiement / parcours | Oui (`lib/push/candidat-events.ts`) |
| Liste « notifications » app candidat | Oui, mais **calculée à la volée** (pas en base, pas de réponse) |
| Accepter / refuser + motif | **En test** (activé pour toutes les écoles, sans limite de pack) |

### Modèle technique recommandé (léger)

Table du type `candidat_engagements` (une ligne par événement à confirmer) :

| Champ | Exemple |
|-------|---------|
| `eleve_id` | lien candidat |
| `type` | `seance` \| `examen` |
| `reference_id` | id séance ou id `liste_examen_candidat` |
| `statut` | `en_attente` \| `accepte` \| `refuse` |
| `motif` | texte si refus (ou commentaire optionnel si accepte) |
| `repondu_at` | date/heure |

**Coût base Supabase : négligeable** pour un SaaS de cette taille.

Ordre de grandeur : 3–5 événements / candidat / mois → 300 candidats actifs ≈ **1 000 lignes/mois** (~ quelques centaines de Ko). Même 50 auto-écoles restent très loin des 500 Mo du plan Free.

| Poste | Impact |
|-------|--------|
| Stockage SQL | Quasi nul |
| Egress API | + quelques Ko par chargement suivi / fiche séance |
| Push Web | Identique à aujourd’hui (pas de surcoût Supabase) |
| MAU Supabase Auth | Inchangé (même candidats) |

### Par pack (recommandation commerciale)

| Pack | Notifications push | Confirmation accepter/refuser + motif |
|------|-------------------|----------------------------------------|
| **Essai** | Oui (limité) | Non (aperçu « bientôt disponible ») |
| **Essentiel** | Non ou lecture seule in-app | **Non** — garde l’écart avec Pro |
| **Pro** | **Oui** | **Oui** — argument commercial fort |
| **Élite** | Oui | Oui + alertes backdash moniteur (badge « 3 refus ») |

**Pourquoi pas Essentiel :** fonction très visible, forte valeur perçue → levier pour passer en **Pro**.  
**Pourquoi Pro et pas seulement Élite :** c’est du métier quotidien (séances + examens), pas un luxe « grosse école ».

### UX pro (résumé)

**Candidat**

- Carte notification : « Créneau circulation — jeudi 14h »  
- [ J’accepte ] [ Je refuse ]  
- Si refus : motif obligatoire (liste courte + « Autre » : texte libre)

**Backdash**

- Sur la séance / l’élève : pastille **Accepté** (vert) / **Refusé** (rouge) + motif  
- Filtre planning : « En attente de confirmation »  
- Option : re-planifier ou appeler le candidat

### Règles métier à trancher plus tard

- Délai de réponse (ex. rappel si pas de réponse sous 48 h)  
- Modification de séance après acceptation → nouvelle demande de confirmation ?  
- Examen : refus = alerte forte (liste officielle déjà déposée ?)

Document de conception détaillé : à rédiger avant développement (`docs/CONFIRMATIONS-CANDIDAT.md`).
