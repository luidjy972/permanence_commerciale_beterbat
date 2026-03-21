import { getApiDocumentation } from './api-docs'

/**
 * Generates a dynamic system prompt for the AI assistant.
 * Every time this is called, it uses the latest API documentation,
 * so updates to api-docs.ts are automatically reflected.
 */
export function getAssistantSystemPrompt(baseUrl: string): string {
  const apiDocs = getApiDocumentation(baseUrl)

  return `Tu es l'assistant IA de Beterbat, une application de gestion commerciale et de planning de permanence hebdomadaire.

## Ton rôle
Tu aides les utilisateurs à gérer leur tableau de bord en effectuant des actions via tes outils (fonctions). Tu peux :
- Gérer les **commerciaux** (ajouter, modifier, supprimer, lister)
- Gérer les **agences** (ajouter, modifier, supprimer, lister)
- Gérer le **planning de permanence** (consulter, générer un nouveau planning)
- Gérer la **prospection** (projets, objectifs)
- Utiliser les **applications** intégrées (simulateur de prix, calculatrice de rentabilité, simulateur de crédit)

## Accès
Tu disposes d'un accès direct à la base de données via tes outils. Tu n'as PAS besoin de clé API ni d'authentification supplémentaire — tu es déjà authentifié. Utilise tes fonctions (tools) directement sans jamais demander une clé API à l'utilisateur.

## Comportement
- Réponds toujours en français.
- Sois concis et professionnel.
- Quand l'utilisateur veut faire une action, utilise IMMÉDIATEMENT les fonctions (tools) disponibles pour l'exécuter. Ne dis jamais que tu ne peux pas le faire ou qu'il te manque une clé.
- Après chaque action, confirme ce qui a été fait avec un résumé clair.
- Si une action échoue, explique l'erreur technique et propose une alternative.
- Quand plusieurs options sont possibles, propose des choix structurés à l'utilisateur.
- Au premier message, présente-toi brièvement et demande ce que l'utilisateur souhaite faire.

## Propositions structurées
Quand tu proposes des choix, utilise le format JSON suivant dans ta réponse pour permettre l'affichage de boutons :
\`\`\`actions
[{"label": "Texte du bouton", "value": "identifiant_action"}]
\`\`\`

Exemples de propositions :
\`\`\`actions
[{"label":"📅 Planning","value":"planning"},{"label":"👥 Commerciaux","value":"commercials"},{"label":"🏢 Agences","value":"agencies"},{"label":"📊 Prospection","value":"prospection"},{"label":"🏠 Applications","value":"applications"},{"label":"👤 Utilisateurs","value":"users"}]
\`\`\`

## Référence des données (basée sur l'API, mise à jour dynamiquement)

Note : Les détails ci-dessous décrivent la structure des données. Toi, tu accèdes aux données directement via tes fonctions (tools), pas via l'API HTTP.

${apiDocs}

## Tables supplémentaires (Prospection)

### Agences
- Table: \`agencies\`
- Champs: id, name, address, phone, created_at
- Le champ \`agency\` de la table \`commercials\` référence le nom de l'agence

### Projets de prospection
- Table: \`prospect_projects\`
- Champs: id, name, contact_name, contact_phone, contact_email, description, amount, status, priority, commercial_id, due_date, closed_at, created_at, updated_at
- Status possibles: nouveau, contact, devis, negociation, gagne, reporte, en_attente, annule
- Priorités: low, medium, high

### Objectifs de prospection
- Table: \`prospection_objectives\` (singleton, id=1)
- Champs: target_closed_contracts, target_revenue, target_total_contract_price, contract_amount_1-4

## Applications intégrées (Outils de calcul)

Tu as accès à 3 mini-applications de calcul via tes outils :

### 1. Simulateur de Prix – Résidence Vue des Îlets
- Programme immobilier de 42 lots (Trois-Îlets, Martinique)
- 3 bâtiments (A, B, C), étages R-1, RDC, R+1, R+2 + 2 Duplex
- Total programme : 13 018 500 €
- Permet de moduler les prix par étage via des coefficients (0.80 à 1.20)
- Le total global reste verrouillé (redistribution à somme constante via facteur λ)
- Duplexes D01 et D02 sont exclus de la modulation
- Prix arrondis à la tranche de 500 €
- Formule : Prix nouveau = Prix actuel × Coefficient × λ
- Utilise `simulate_pricing` pour lancer une simulation

### 2. Calculatrice de Rentabilité Locative
- Calcule les rendements brut et net d'un investissement immobilier
- Rendement brut = Loyers bruts annuels / Investissement total × 100
- Rendement net = (Loyers effectifs − Charges totales) / Investissement total × 100
- Prend en compte : frais de notaire, travaux, charges, taxe foncière, assurance PNO, frais de gestion, taux de vacance
- Utilise `calculate_rentabilite` pour faire un calcul

### 3. Simulateur de Crédit Immobilier
- Calcule les mensualités selon la formule d'annuité constante
- Mensualité = [Capital × Taux × (1+Taux)^n] / [(1+Taux)^n − 1]
- Prend en compte l'assurance emprunteur et l'apport personnel
- Calcule le taux d'endettement (seuil HCSF ≤ 33%)
- Fournit un tableau d'amortissement annuel
- Fournit la répartition du coût (capital / intérêts / assurance)
- Utilise `simulate_credit` pour faire une simulation

## Note importante
Chaque modification est automatiquement enregistrée dans l'historique. L'utilisateur peut annuler n'importe quelle action.`
}

/**
 * OpenAI function definitions for the assistant.
 * These map to internal API calls the assistant can make.
 */
export function getAssistantTools() {
  return [
    {
      type: 'function' as const,
      function: {
        name: 'list_commercials',
        description: 'Lister tous les commerciaux ou uniquement les actifs',
        parameters: {
          type: 'object',
          properties: {
            active_only: {
              type: 'boolean',
              description: 'Si true, retourne uniquement les commerciaux actifs au planning',
            },
          },
          required: [],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_commercial',
        description: 'Obtenir les détails d\'un commercial par son ID',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'ID du commercial' },
          },
          required: ['id'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'create_commercial',
        description: 'Ajouter un nouveau commercial',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nom du commercial (obligatoire)' },
            agency: { type: 'string', description: 'Agence' },
            phone: { type: 'string', description: 'Téléphone' },
            email: { type: 'string', description: 'Email' },
            is_active_in_planning: { type: 'boolean', description: 'Actif dans le planning (défaut: true)' },
            is_prospect: { type: 'boolean', description: 'Est un prospecteur (défaut: false)' },
            notes: { type: 'string', description: 'Notes' },
            position: { type: 'number', description: 'Position dans la liste' },
          },
          required: ['name'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'update_commercial',
        description: 'Modifier un commercial existant',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'ID du commercial' },
            name: { type: 'string', description: 'Nouveau nom' },
            agency: { type: 'string', description: 'Nouvelle agence' },
            phone: { type: 'string', description: 'Nouveau téléphone' },
            email: { type: 'string', description: 'Nouvel email' },
            is_active_in_planning: { type: 'boolean', description: 'Actif dans le planning' },
            is_prospect: { type: 'boolean', description: 'Est un prospecteur' },
            notes: { type: 'string', description: 'Nouvelles notes' },
            position: { type: 'number', description: 'Nouvelle position' },
          },
          required: ['id'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'delete_commercial',
        description: 'Supprimer un commercial par son ID',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'ID du commercial à supprimer' },
          },
          required: ['id'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'list_agencies',
        description: 'Lister toutes les agences',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_agency',
        description: 'Obtenir les détails d\'une agence par son ID',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'ID de l\'agence' },
          },
          required: ['id'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'create_agency',
        description: 'Ajouter une nouvelle agence',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nom de l\'agence (obligatoire)' },
            address: { type: 'string', description: 'Adresse' },
            phone: { type: 'string', description: 'Téléphone' },
          },
          required: ['name'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'update_agency',
        description: 'Modifier une agence existante',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'ID de l\'agence' },
            name: { type: 'string', description: 'Nouveau nom' },
            address: { type: 'string', description: 'Nouvelle adresse' },
            phone: { type: 'string', description: 'Nouveau téléphone' },
          },
          required: ['id'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'delete_agency',
        description: 'Supprimer une agence par son ID',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'ID de l\'agence à supprimer' },
          },
          required: ['id'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_planning',
        description: 'Obtenir le planning actuel complet',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'generate_planning',
        description: 'Générer un nouveau planning de rotation',
        parameters: {
          type: 'object',
          properties: {
            week_start: { type: 'string', description: 'Date du lundi de début (YYYY-MM-DD)' },
            planning_weeks: { type: 'number', description: 'Nombre de semaines (1-52)' },
            start_index: { type: 'number', description: 'Index du commercial qui commence la rotation repos' },
            rotation_mode: { type: 'string', enum: ['weekly', 'monthly'], description: 'Mode de rotation' },
          },
          required: [],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'list_prospect_projects',
        description: 'Lister les projets de prospection avec filtres optionnels',
        parameters: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'Filtrer par status (nouveau, contact, devis, negociation, gagne, reporte, en_attente, annule)' },
            commercial_id: { type: 'number', description: 'Filtrer par commercial' },
          },
          required: [],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'create_prospect_project',
        description: 'Créer un nouveau projet de prospection',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nom du projet (obligatoire)' },
            contact_name: { type: 'string', description: 'Nom du contact' },
            contact_phone: { type: 'string', description: 'Téléphone du contact' },
            contact_email: { type: 'string', description: 'Email du contact' },
            description: { type: 'string', description: 'Description du projet' },
            amount: { type: 'number', description: 'Montant estimé' },
            status: { type: 'string', enum: ['nouveau', 'contact', 'devis', 'negociation', 'gagne', 'reporte', 'en_attente', 'annule'], description: 'Statut' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priorité' },
            commercial_id: { type: 'number', description: 'ID du commercial assigné' },
            due_date: { type: 'string', description: 'Date d\'échéance (YYYY-MM-DD)' },
          },
          required: ['name'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'update_prospect_project',
        description: 'Modifier un projet de prospection existant',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'ID du projet' },
            name: { type: 'string', description: 'Nouveau nom' },
            contact_name: { type: 'string', description: 'Nom du contact' },
            contact_phone: { type: 'string', description: 'Téléphone du contact' },
            contact_email: { type: 'string', description: 'Email du contact' },
            description: { type: 'string', description: 'Description' },
            amount: { type: 'number', description: 'Montant' },
            status: { type: 'string', enum: ['nouveau', 'contact', 'devis', 'negociation', 'gagne', 'reporte', 'en_attente', 'annule'], description: 'Statut' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priorité' },
            commercial_id: { type: 'number', description: 'ID du commercial' },
            due_date: { type: 'string', description: 'Date d\'échéance' },
          },
          required: ['id'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'delete_prospect_project',
        description: 'Supprimer un projet de prospection',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'ID du projet à supprimer' },
          },
          required: ['id'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_prospection_objectives',
        description: 'Obtenir les objectifs de prospection',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'update_prospection_objectives',
        description: 'Modifier les objectifs de prospection',
        parameters: {
          type: 'object',
          properties: {
            target_closed_contracts: { type: 'number', description: 'Objectif de contrats fermés' },
            target_revenue: { type: 'number', description: 'Objectif de chiffre d\'affaires' },
            target_total_contract_price: { type: 'number', description: 'Objectif de prix total des contrats' },
            contract_amount_1: { type: 'number', description: 'Montant contrat 1' },
            contract_amount_2: { type: 'number', description: 'Montant contrat 2' },
            contract_amount_3: { type: 'number', description: 'Montant contrat 3' },
            contract_amount_4: { type: 'number', description: 'Montant contrat 4' },
          },
          required: [],
        },
      },
    },

    // ===== APPLICATIONS =====
    {
      type: 'function' as const,
      function: {
        name: 'simulate_pricing',
        description: 'Simuler les prix de la Résidence Vue des Îlets en ajustant les coefficients par étage. Le total global reste verrouillé à 13 018 500 €. Les coefficients vont de 0.80 à 1.20 (1.0 = prix actuel).',
        parameters: {
          type: 'object',
          properties: {
            coeff_r_minus_1: { type: 'number', description: 'Coefficient pour R-1 / Sous-sol (0.80 à 1.20, défaut: 1.0)' },
            coeff_rdc: { type: 'number', description: 'Coefficient pour RDC / Rez-de-chaussée (0.80 à 1.20, défaut: 1.0)' },
            coeff_r_plus_1: { type: 'number', description: 'Coefficient pour R+1 / 1er étage (0.80 à 1.20, défaut: 1.0)' },
            coeff_r_plus_2: { type: 'number', description: 'Coefficient pour R+2 / 2ème étage (0.80 à 1.20, défaut: 1.0)' },
            batiment: { type: 'string', enum: ['all', 'A', 'B', 'C'], description: 'Filtrer par bâtiment (défaut: all)' },
          },
          required: [],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'calculate_rentabilite',
        description: 'Calculer la rentabilité locative brute et nette d\'un bien immobilier.',
        parameters: {
          type: 'object',
          properties: {
            purchase_price: { type: 'number', description: 'Prix d\'achat du bien en euros (obligatoire)' },
            monthly_rent: { type: 'number', description: 'Loyer mensuel en euros (obligatoire)' },
            notary_fees_pct: { type: 'number', description: 'Frais de notaire en % (défaut: 8)' },
            renovation_cost: { type: 'number', description: 'Coût des travaux en euros (défaut: 0)' },
            monthly_charges: { type: 'number', description: 'Charges mensuelles en euros (défaut: 0)' },
            annual_tax: { type: 'number', description: 'Taxe foncière annuelle en euros (défaut: 0)' },
            annual_insurance: { type: 'number', description: 'Assurance PNO annuelle en euros (défaut: 0)' },
            management_fee_pct: { type: 'number', description: 'Frais de gestion en % des loyers (défaut: 0)' },
            vacancy_rate_pct: { type: 'number', description: 'Taux de vacance locative en % (défaut: 0)' },
          },
          required: ['purchase_price', 'monthly_rent'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'simulate_credit',
        description: 'Simuler un crédit immobilier : mensualités, coût total, taux d\'endettement et tableau d\'amortissement.',
        parameters: {
          type: 'object',
          properties: {
            loan_amount: { type: 'number', description: 'Montant du bien en euros (obligatoire)' },
            annual_rate: { type: 'number', description: 'Taux annuel en % (obligatoire, ex: 3.5)' },
            duration_years: { type: 'number', description: 'Durée du prêt en années (obligatoire, 1-30)' },
            insurance_rate_pct: { type: 'number', description: 'Taux d\'assurance emprunteur en % (défaut: 0.34)' },
            personal_contribution: { type: 'number', description: 'Apport personnel en euros (défaut: 0)' },
            monthly_income: { type: 'number', description: 'Revenus mensuels nets du foyer en euros (pour calcul endettement)' },
          },
          required: ['loan_amount', 'annual_rate', 'duration_years'],
        },
      },
    },
  ]
}
