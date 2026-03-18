export function getApiDocumentation(baseUrl: string): string {
  return `# API Beterbat Planning — Documentation

## Informations générales

Cette API permet de gérer le planning de permanence hebdomadaire et les commerciaux de Beterbat.
Elle est conçue pour être utilisée par des agents IA afin de consulter et modifier les données du tableau de bord.

## Authentification

Toutes les requêtes nécessitent une clé API dans l'en-tête \`Authorization\` :

\`\`\`
Authorization: Bearer VOTRE_CLE_API
\`\`\`

## URL de base

\`${baseUrl}/api\`

---

## Endpoints

### 📅 Planning

#### Obtenir le planning actuel

\`\`\`
GET ${baseUrl}/api/planning
\`\`\`

Retourne l'état complet du planning : paramètres de configuration et toutes les semaines générées.

**Réponse :**
\`\`\`json
{
  "data": {
    "id": 1,
    "week_start": "2026-03-16",
    "planning_weeks": 12,
    "start_index": 0,
    "rotation_mode": "weekly",
    "planning_data": [
      {
        "weekIndex": 0,
        "weekNumber": 12,
        "weekStart": "2026-03-16",
        "weekEnd": "2026-03-20",
        "offPerson": "Jean Dupont",
        "activePeople": ["Marie Martin", "Pierre Bernard"],
        "entries": [
          {
            "dayLabel": "Lundi",
            "date": "2026-03-16",
            "shiftLabel": "Matin",
            "timeRange": "8H00 - 13H00",
            "assignee": "Marie Martin"
          }
        ]
      }
    ],
    "updated_at": "2026-03-17T10:00:00Z"
  }
}
\`\`\`

**Structure d'une semaine (PlanningWeek) :**
- \`weekIndex\` : Index de la semaine (0 = première semaine)
- \`weekNumber\` : Numéro ISO de la semaine dans l'année
- \`weekStart\` / \`weekEnd\` : Dates du lundi et vendredi (YYYY-MM-DD)
- \`offPerson\` : Commercial en repos cette semaine (vide si ≤ 5 commerciaux)
- \`activePeople\` : Liste des commerciaux actifs cette semaine
- \`entries\` : 10 créneaux par semaine (5 jours × 2 shifts)

**Structure d'un créneau (PlanningEntry) :**
- \`dayLabel\` : Lundi, Mardi, Mercredi, Jeudi ou Vendredi
- \`date\` : Date au format YYYY-MM-DD
- \`shiftLabel\` : "Matin" ou "Après-midi"
- \`timeRange\` : "8H00 - 13H00" (matin) ou "14H00 - 17H00" (après-midi)
- \`assignee\` : Nom du commercial assigné à ce créneau

---

#### Générer un nouveau planning

\`\`\`
POST ${baseUrl}/api/planning/generate
\`\`\`

Génère un nouveau planning de rotation à partir des commerciaux actifs et l'enregistre en base.
Tous les paramètres sont optionnels — les valeurs actuelles sont conservées par défaut.

**Corps de la requête (JSON) :**
\`\`\`json
{
  "week_start": "2026-03-16",
  "planning_weeks": 12,
  "start_index": 0,
  "rotation_mode": "weekly"
}
\`\`\`

**Paramètres :**
| Champ | Type | Description |
|---|---|---|
| \`week_start\` | string (YYYY-MM-DD) | Date du lundi de début. Doit être un lundi. |
| \`planning_weeks\` | number (1-52) | Nombre de semaines à planifier |
| \`start_index\` | number | Index du commercial qui commence la rotation des repos (base 0) |
| \`rotation_mode\` | "weekly" ou "monthly" | weekly = changement de repos chaque semaine, monthly = chaque mois (par blocs de 4 semaines) |

**Réponse :**
\`\`\`json
{
  "message": "Planning généré avec succès.",
  "parameters": {
    "week_start": "2026-03-16",
    "planning_weeks": 12,
    "start_index": 0,
    "rotation_mode": "weekly"
  },
  "data": [ ... tableau de PlanningWeek ... ]
}
\`\`\`

---

### 👥 Commerciaux

#### Lister les commerciaux

\`\`\`
GET ${baseUrl}/api/commercials
\`\`\`

**Paramètres de requête (optionnels) :**
- \`?active=true\` : Retourne uniquement les commerciaux actifs au planning

**Réponse :**
\`\`\`json
{
  "data": [
    {
      "id": 1,
      "name": "Jean Dupont",
      "agency": "Agence Nord",
      "phone": "0601020304",
      "email": "jean@example.com",
      "is_active_in_planning": true,
      "is_prospect": false,
      "notes": "",
      "position": 0,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
\`\`\`

---

#### Ajouter un commercial

\`\`\`
POST ${baseUrl}/api/commercials
\`\`\`

**Corps de la requête (JSON) :**
\`\`\`json
{
  "name": "Nouveau Commercial",
  "agency": "Agence Sud",
  "phone": "0601020304",
  "email": "nouveau@example.com",
  "is_active_in_planning": true,
  "is_prospect": false,
  "notes": "Notes optionnelles",
  "position": 5
}
\`\`\`

**Champ obligatoire :** \`name\`
**Champs optionnels :** \`agency\`, \`phone\`, \`email\`, \`is_active_in_planning\` (défaut: true), \`is_prospect\` (défaut: false), \`notes\`, \`position\` (défaut: 0)

---

#### Obtenir un commercial

\`\`\`
GET ${baseUrl}/api/commercials/{id}
\`\`\`

**Réponse :**
\`\`\`json
{
  "data": {
    "id": 1,
    "name": "Jean Dupont",
    "agency": "Agence Nord",
    "phone": "0601020304",
    "email": "jean@example.com",
    "is_active_in_planning": true,
    "is_prospect": false,
    "notes": "",
    "position": 0,
    "created_at": "2026-01-15T10:00:00Z"
  }
}
\`\`\`

---

#### Modifier un commercial

\`\`\`
PATCH ${baseUrl}/api/commercials/{id}
\`\`\`

Envoyer uniquement les champs à modifier :
\`\`\`json
{
  "is_active_in_planning": false,
  "notes": "En congé jusqu'au 01/04"
}
\`\`\`

**Champs modifiables :** \`name\`, \`agency\`, \`phone\`, \`email\`, \`is_active_in_planning\`, \`is_prospect\`, \`notes\`, \`position\`

---

#### Supprimer un commercial

\`\`\`
DELETE ${baseUrl}/api/commercials/{id}
\`\`\`

**Réponse :**
\`\`\`json
{
  "message": "Commercial supprimé."
}
\`\`\`

---

### 🏢 Agences

#### Lister les agences

\`\`\`
GET ${baseUrl}/api/agencies
\`\`\`

**Réponse :**
\`\`\`json
{
  "data": [
    {
      "id": 1,
      "name": "Fort-de-France",
      "address": "123 rue Exemple",
      "phone": "0596 XX XX XX",
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
\`\`\`

---

#### Ajouter une agence

\`\`\`
POST ${baseUrl}/api/agencies
\`\`\`

**Corps de la requête (JSON) :**
\`\`\`json
{
  "name": "Nouvelle Agence",
  "address": "456 rue Exemple",
  "phone": "0596 XX XX XX"
}
\`\`\`

**Champ obligatoire :** \`name\`
**Champs optionnels :** \`address\`, \`phone\`

---

#### Obtenir une agence

\`\`\`
GET ${baseUrl}/api/agencies/{id}
\`\`\`

**Réponse :**
\`\`\`json
{
  "data": {
    "id": 1,
    "name": "Fort-de-France",
    "address": "123 rue Exemple",
    "phone": "0596 XX XX XX",
    "created_at": "2026-01-15T10:00:00Z"
  }
}
\`\`\`

---

#### Modifier une agence

\`\`\`
PATCH ${baseUrl}/api/agencies/{id}
\`\`\`

Envoyer uniquement les champs à modifier :
\`\`\`json
{
  "address": "Nouvelle adresse"
}
\`\`\`

**Champs modifiables :** \`name\`, \`address\`, \`phone\`

---

#### Supprimer une agence

\`\`\`
DELETE ${baseUrl}/api/agencies/{id}
\`\`\`

**Réponse :**
\`\`\`json
{
  "message": "Agence supprimée."
}
\`\`\`

---

### 📊 Prospection — Projets

#### Lister les projets de prospection

\`\`\`
GET ${baseUrl}/api/prospection/projects
\`\`\`

**Paramètres de requête (optionnels) :**
- \`?status=nouveau\` : Filtrer par statut (nouveau, contact, devis, negociation, gagne, reporte, en_attente, annule)
- \`?commercial_id=1\` : Filtrer par commercial assigné
- \`?priority=high\` : Filtrer par priorité (low, medium, high)

**Réponse :**
\`\`\`json
{
  "data": [
    {
      "id": 1,
      "name": "Projet Résidence Bord de Mer",
      "contact_name": "M. Martin",
      "contact_phone": "0601020304",
      "contact_email": "martin@example.com",
      "description": "Construction résidence 12 lots",
      "amount": 150000,
      "status": "devis",
      "priority": "high",
      "commercial_id": 2,
      "due_date": "2026-06-15",
      "closed_at": null,
      "created_at": "2026-03-01T10:00:00Z",
      "updated_at": "2026-03-10T14:30:00Z",
      "commercials": { "name": "Marie Martin" }
    }
  ]
}
\`\`\`

---

#### Créer un projet de prospection

\`\`\`
POST ${baseUrl}/api/prospection/projects
\`\`\`

**Corps de la requête (JSON) :**
\`\`\`json
{
  "name": "Nouveau Projet",
  "contact_name": "M. Dupont",
  "contact_phone": "0601020304",
  "contact_email": "dupont@example.com",
  "description": "Rénovation bureaux",
  "amount": 50000,
  "status": "nouveau",
  "priority": "medium",
  "commercial_id": 1,
  "due_date": "2026-09-01"
}
\`\`\`

**Champ obligatoire :** \`name\`
**Champs optionnels :** \`contact_name\`, \`contact_phone\`, \`contact_email\`, \`description\`, \`amount\`, \`status\` (défaut: nouveau), \`priority\` (défaut: medium), \`commercial_id\`, \`due_date\`

**Statuts possibles :** nouveau, contact, devis, negociation, gagne, reporte, en_attente, annule
**Priorités possibles :** low, medium, high

---

#### Obtenir un projet de prospection

\`\`\`
GET ${baseUrl}/api/prospection/projects/{id}
\`\`\`

---

#### Modifier un projet de prospection

\`\`\`
PATCH ${baseUrl}/api/prospection/projects/{id}
\`\`\`

Envoyer uniquement les champs à modifier :
\`\`\`json
{
  "status": "gagne",
  "amount": 175000
}
\`\`\`

**Note :** Lorsque le statut passe à "gagne", le champ \`closed_at\` est automatiquement rempli.

**Champs modifiables :** \`name\`, \`contact_name\`, \`contact_phone\`, \`contact_email\`, \`description\`, \`amount\`, \`status\`, \`priority\`, \`commercial_id\`, \`due_date\`

---

#### Supprimer un projet de prospection

\`\`\`
DELETE ${baseUrl}/api/prospection/projects/{id}
\`\`\`

**Réponse :**
\`\`\`json
{
  "message": "Projet de prospection supprimé."
}
\`\`\`

---

### 🎯 Prospection — Objectifs

#### Obtenir les objectifs de prospection

\`\`\`
GET ${baseUrl}/api/prospection/objectives
\`\`\`

**Réponse :**
\`\`\`json
{
  "data": {
    "id": 1,
    "target_closed_contracts": 10,
    "target_revenue": 500000,
    "target_total_contract_price": 1000000,
    "contract_amount_1": 50000,
    "contract_amount_2": 100000,
    "contract_amount_3": 200000,
    "contract_amount_4": null,
    "updated_at": "2026-03-17T10:00:00Z"
  }
}
\`\`\`

---

#### Modifier les objectifs de prospection

\`\`\`
PATCH ${baseUrl}/api/prospection/objectives
\`\`\`

Envoyer uniquement les champs à modifier :
\`\`\`json
{
  "target_closed_contracts": 15,
  "target_revenue": 750000
}
\`\`\`

**Champs modifiables :** \`target_closed_contracts\`, \`target_revenue\`, \`target_total_contract_price\`, \`contract_amount_1\`, \`contract_amount_2\`, \`contract_amount_3\`, \`contract_amount_4\`

---

## Codes de réponse

| Code | Signification |
|---|---|
| 200 | Succès |
| 201 | Création réussie |
| 400 | Requête invalide (paramètres manquants ou incorrects) |
| 401 | Clé API invalide ou manquante |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## Exemples de flux de travail

### Consulter qui travaille demain matin
1. \`GET /api/planning\` → Récupérer le planning complet
2. Dans \`planning_data\`, chercher l'entrée dont \`date\` correspond à demain et \`shiftLabel\` vaut "Matin"
3. Le champ \`assignee\` indique le commercial assigné

### Régénérer le planning à partir de la semaine prochaine
1. \`GET /api/commercials?active=true\` → Vérifier les commerciaux actifs
2. \`POST /api/planning/generate\` avec \`{ "week_start": "YYYY-MM-DD" }\` (lundi de la semaine souhaitée)
3. Le planning est automatiquement enregistré et visible dans le tableau de bord

### Ajouter un commercial et régénérer
1. \`POST /api/commercials\` → Créer le nouveau commercial (il sera actif par défaut)
2. \`POST /api/planning/generate\` → Régénérer pour inclure le nouveau commercial

### Désactiver un commercial du planning
1. \`PATCH /api/commercials/{id}\` avec \`{ "is_active_in_planning": false }\`
2. \`POST /api/planning/generate\` → Régénérer sans ce commercial

### Voir le résumé d'une semaine précise
1. \`GET /api/planning\` → Récupérer tout le planning
2. Filtrer \`planning_data\` par \`weekNumber\` ou \`weekStart\` pour la semaine voulue
3. \`offPerson\` indique qui est en repos, \`entries\` liste tous les créneaux

### Créer un nouveau projet de prospection et l'assigner
1. \`GET /api/commercials\` → Lister les commerciaux disponibles
2. \`POST /api/prospection/projects\` avec \`{ "name": "...", "commercial_id": X, "status": "nouveau" }\`
3. Le projet apparaît dans le tableau de bord de prospection

### Suivre le pipeline de prospection
1. \`GET /api/prospection/projects\` → Voir tous les projets
2. Filtrer par statut pour voir les projets en \`devis\`, \`negociation\`, etc.
3. \`GET /api/prospection/objectives\` → Comparer avec les objectifs définis

### Passer un projet en "gagné"
1. \`PATCH /api/prospection/projects/{id}\` avec \`{ "status": "gagne" }\`
2. Le champ \`closed_at\` est automatiquement rempli
3. \`GET /api/prospection/objectives\` → Vérifier la progression vers les objectifs

### Gérer les agences et leurs commerciaux
1. \`GET /api/agencies\` → Lister les agences
2. \`POST /api/agencies\` → Créer une nouvelle agence
3. \`PATCH /api/commercials/{id}\` avec \`{ "agency": "Nom Agence" }\` → Assigner un commercial à l'agence
`
}
