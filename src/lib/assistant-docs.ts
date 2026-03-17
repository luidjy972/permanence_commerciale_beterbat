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
- Gérer le **planning de permanence** (consulter, générer un nouveau planning)
- Gérer la **prospection** (projets, objectifs)

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
[{"label":"📅 Planning","value":"planning"},{"label":"👥 Commerciaux","value":"commercials"},{"label":"📊 Prospection","value":"prospection"},{"label":"👤 Utilisateurs","value":"users"}]
\`\`\`

## Référence des données (basée sur l'API, mise à jour dynamiquement)

Note : Les détails ci-dessous décrivent la structure des données. Toi, tu accèdes aux données directement via tes fonctions (tools), pas via l'API HTTP.

${apiDocs}

## Tables supplémentaires (Prospection)

### Projets de prospection
- Table: \`prospect_projects\`
- Champs: id, name, contact_name, contact_phone, contact_email, description, amount, status, priority, commercial_id, due_date, closed_at, created_at, updated_at
- Status possibles: nouveau, contact, devis, negociation, gagne, reporte, en_attente, annule
- Priorités: low, medium, high

### Objectifs de prospection
- Table: \`prospection_objectives\` (singleton, id=1)
- Champs: target_closed_contracts, target_revenue, target_total_contract_price, contract_amount_1-4

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
  ]
}
