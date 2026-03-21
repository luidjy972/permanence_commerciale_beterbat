export interface Agency {
  id?: number
  name: string
  address: string
  phone: string
  created_at?: string
}

export interface Commercial {
  id?: number
  name: string
  agency: string
  phone: string
  email: string
  is_active_in_planning: boolean
  is_prospect: boolean
  notes: string
  position: number
  created_at?: string
}

export interface PlanningEntry {
  weekIndex: number
  weekNumber: number
  weekStart: string
  weekEnd: string
  offPerson: string
  dayLabel: string
  date: string
  shiftLabel: string
  timeRange: string
  assignee: string
}

export interface PlanningWeek {
  weekIndex: number
  weekNumber: number
  weekStart: string
  weekEnd: string
  offPerson: string
  activePeople: string[]
  entries: PlanningEntry[]
}

export interface PlanningState {
  id: number
  week_start: string | null
  planning_weeks: number
  start_index: number
  rotation_mode: 'weekly' | 'monthly'
  planning_data: PlanningWeek[]
  updated_at: string
}

export interface AppUser {
  id: number
  auth_id: string
  email: string
  name: string
  role: 'admin' | 'user'
  active: boolean
  created_at: string
}

export type ProjectStatus = 'nouveau' | 'contact' | 'devis' | 'negociation' | 'gagne' | 'reporte' | 'en_attente' | 'annule'
export type ProjectPriority = 'low' | 'medium' | 'high'

export interface ProspectProject {
  id?: number
  name: string
  contact_name: string
  contact_phone: string
  contact_email: string
  description: string
  amount: number
  status: ProjectStatus
  priority: ProjectPriority
  commercial_id: number | null
  due_date: string | null
  closed_at: string | null
  created_at?: string
  updated_at?: string
  commercials?: Commercial
}

export interface ProspectionObjectives {
  id: number
  target_closed_contracts: number
  target_revenue: number
  target_total_contract_price: number
  contract_amount_1: number | null
  contract_amount_2: number | null
  contract_amount_3: number | null
  contract_amount_4: number | null
  updated_at: string
}

export interface AppSpecification {
  id?: number
  title: string
  slug: string
  description: string | null
  status: 'draft' | 'validated' | 'implemented'
  spec_content: string
  created_at?: string
  updated_at?: string
}
