export type Database = {
  hippos: {
    Tables: {
      patients: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          birth_date: string;
          sex: 'M' | 'F';
          weight: number;
          height: number;
          pathologies: string[];
          food_allergies: string[];
          objective: 'WEIGHT_LOSS' | 'MAINTENANCE' | 'MUSCLE_GAIN' | 'PREGNANCY' | 'OTHER';
          activity_level: 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTREMELY_ACTIVE';
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          birth_date: string;
          sex: 'M' | 'F';
          weight: number;
          height: number;
          pathologies?: string[];
          food_allergies?: string[];
          objective: 'WEIGHT_LOSS' | 'MAINTENANCE' | 'MUSCLE_GAIN' | 'PREGNANCY' | 'OTHER';
          activity_level: 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTREMELY_ACTIVE';
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          birth_date?: string;
          sex?: 'M' | 'F';
          weight?: number;
          height?: number;
          pathologies?: string[];
          food_allergies?: string[];
          objective?: 'WEIGHT_LOSS' | 'MAINTENANCE' | 'MUSCLE_GAIN' | 'PREGNANCY' | 'OTHER';
          activity_level?: 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTREMELY_ACTIVE';
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tmb_calculations: {
        Row: {
          id: string;
          patient_id: string;
          current_weight: number;
          height: number;
          age: number;
          sex: 'M' | 'F';
          activity_level: string;
          activity_factor: number;
          objective: string;
          current_bmi: number;
          target_bmi: number;
          healthy_weight: number;
          requirement_weight: number;
          tmb: number;
          tdee: number;
          caloric_restriction: number;
          target_calories: number;
          formula_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          current_weight: number;
          height: number;
          age: number;
          sex: 'M' | 'F';
          activity_level: string;
          activity_factor: number;
          objective: string;
          current_bmi: number;
          target_bmi: number;
          healthy_weight: number;
          requirement_weight?: number;
          tmb: number;
          tdee: number;
          caloric_restriction?: number;
          target_calories: number;
          formula_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          current_weight?: number;
          height?: number;
          age?: number;
          sex?: 'M' | 'F';
          activity_level?: string;
          activity_factor?: number;
          objective?: string;
          current_bmi?: number;
          target_bmi?: number;
          healthy_weight?: number;
          requirement_weight?: number;
          tmb?: number;
          tdee?: number;
          caloric_restriction?: number;
          target_calories?: number;
          formula_type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      formula_sessions: {
        Row: {
          id: string;
          patient_id: string;
          tmb_calculation_id: string;
          target_calories: number;
          exchanges: { subgroupId: string; exchanges: number }[];
          total_protein: number;
          total_fat: number;
          total_carbs: number;
          protein_kcal: number;
          fat_kcal: number;
          carbs_kcal: number;
          total_kcal: number;
          protein_percent: number;
          fat_percent: number;
          carbs_percent: number;
          adequacy_percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          tmb_calculation_id: string;
          target_calories: number;
          exchanges: { subgroupId: string; exchanges: number }[];
          total_protein: number;
          total_fat: number;
          total_carbs: number;
          protein_kcal: number;
          fat_kcal: number;
          carbs_kcal: number;
          total_kcal: number;
          protein_percent: number;
          fat_percent: number;
          carbs_percent: number;
          adequacy_percent: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          tmb_calculation_id?: string;
          target_calories?: number;
          exchanges?: { subgroupId: string; exchanges: number }[];
          total_protein?: number;
          total_fat?: number;
          total_carbs?: number;
          protein_kcal?: number;
          fat_kcal?: number;
          carbs_kcal?: number;
          total_kcal?: number;
          protein_percent?: number;
          fat_percent?: number;
          carbs_percent?: number;
          adequacy_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinical_params: {
        Row: {
          id: string;
          category: 'ACTIVITY_FACTOR' | 'MIFFLIN_COEFFICIENT' | 'MACRO_RANGE';
          key: string;
          label: string;
          description: string;
          value: number;
          max_value: number | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: 'ACTIVITY_FACTOR' | 'MIFFLIN_COEFFICIENT' | 'MACRO_RANGE';
          key: string;
          label: string;
          description?: string;
          value: number;
          max_value?: number | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: 'ACTIVITY_FACTOR' | 'MIFFLIN_COEFFICIENT' | 'MACRO_RANGE';
          key?: string;
          label?: string;
          description?: string;
          value?: number;
          max_value?: number | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      meal_distributions: {
        Row: {
          id: string;
          formula_session_id: string;
          patient_id: string;
          distribution: Record<string, { breakfast: number; morningSnack: number; lunch: number; afternoonSnack: number; dinner: number }>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          formula_session_id: string;
          patient_id: string;
          distribution: Record<string, { breakfast: number; morningSnack: number; lunch: number; afternoonSnack: number; dinner: number }>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          formula_session_id?: string;
          patient_id?: string;
          distribution?: Record<string, { breakfast: number; morningSnack: number; lunch: number; afternoonSnack: number; dinner: number }>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      food_equivalencies: {
        Row: {
          id: string;
          summary_group: string;
          food_name: string;
          portion_desc: string;
          portion_grams: number | null;
          notes: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          summary_group: string;
          food_name: string;
          portion_desc: string;
          portion_grams?: number | null;
          notes?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          summary_group?: string;
          food_name?: string;
          portion_desc?: string;
          portion_grams?: number | null;
          notes?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plan_template_slides: {
        Row: {
          id: string;
          title: string;
          category: string;
          content: { heading: string; body?: string; bullets?: string[]; imageHint?: string; backgroundColor?: string };
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          category: string;
          content: { heading: string; body?: string; bullets?: string[]; imageHint?: string; backgroundColor?: string };
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string;
          content?: { heading: string; body?: string; bullets?: string[]; imageHint?: string; backgroundColor?: string };
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      generated_plans: {
        Row: {
          id: string;
          patient_id: string;
          formula_session_id: string;
          meal_distribution_id: string;
          plan_title: string;
          objective_text: string;
          duration_months: number;
          weight_loss_per_month: number;
          weight_goals: { date: string; targetWeight: number }[];
          template_slide_ids: string[];
          generated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          formula_session_id: string;
          meal_distribution_id: string;
          plan_title: string;
          objective_text: string;
          duration_months: number;
          weight_loss_per_month: number;
          weight_goals: { date: string; targetWeight: number }[];
          template_slide_ids: string[];
          generated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          formula_session_id?: string;
          meal_distribution_id?: string;
          plan_title?: string;
          objective_text?: string;
          duration_months?: number;
          weight_loss_per_month?: number;
          weight_goals?: { date: string; targetWeight: number }[];
          template_slide_ids?: string[];
          generated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      report_view: {
        Row: {
          formula_id: string;
          formula_date: string;
          patient_id: string;
          patient_name: string;
          patient_sex: 'M' | 'F';
          patient_age: number;
          objective: string;
          current_weight: number;
          healthy_weight: number;
          current_bmi: number;
          target_bmi: number;
          target_calories: number;
          total_kcal: number;
          adequacy_percent: number;
          protein_percent: number;
          fat_percent: number;
          carbs_percent: number;
          tmb_calculation_id: string;
          exchanges: { subgroupId: string; exchanges: number }[];
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      patient_objective: 'WEIGHT_LOSS' | 'MAINTENANCE' | 'MUSCLE_GAIN' | 'PREGNANCY' | 'OTHER';
      activity_level: 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTREMELY_ACTIVE';
      sex_type: 'M' | 'F';
      param_category: 'ACTIVITY_FACTOR' | 'MIFFLIN_COEFFICIENT' | 'MACRO_RANGE';
    };
    CompositeTypes: Record<string, never>;
  };
};

// Convenience aliases for service-layer converters
export type DbPatient = Database['hippos']['Tables']['patients']['Row'];
export type DbTmbCalculation = Database['hippos']['Tables']['tmb_calculations']['Row'];
export type DbFormulaSession = Database['hippos']['Tables']['formula_sessions']['Row'];
export type DbReportRow = Database['hippos']['Views']['report_view']['Row'];
export type DbClinicalParam = Database['hippos']['Tables']['clinical_params']['Row'];
export type DbClinicalParamUpdate = Pick<DbClinicalParam, 'value' | 'max_value' | 'label' | 'description'>;

// ─── Business types for clinical params ─────────────────────

export type ParamCategory = 'ACTIVITY_FACTOR' | 'MIFFLIN_COEFFICIENT' | 'MACRO_RANGE';

export interface ActivityFactorParam {
  id: string;
  key: string;
  label: string;
  description: string;
  factor: number;
}

export interface MifflinCoefficients {
  weightCoefficient: number;
  heightCoefficient: number;
  ageCoefficient: number;
  maleConstant: number;
  femaleConstant: number;
}

export interface MacroRange {
  id: string;
  key: string;
  label: string;
  min: number;
  max: number;
}

export const DEFAULT_MIFFLIN_COEFFICIENTS: MifflinCoefficients = {
  weightCoefficient: 10,
  heightCoefficient: 6.25,
  ageCoefficient: 5,
  maleConstant: 5,
  femaleConstant: -161,
};

// ─── meal_distributions ───

export interface MealTimeAllocation {
  breakfast: number;
  morningSnack: number;
  lunch: number;
  afternoonSnack: number;
  dinner: number;
}

export type MealDistributionMap = Record<string, MealTimeAllocation>;

export interface DbMealDistribution {
  id: string;
  formula_session_id: string;
  patient_id: string;
  distribution: MealDistributionMap;
  created_at: string;
  updated_at: string;
}

export type DbMealDistributionInsert = Omit<DbMealDistribution, 'id' | 'created_at' | 'updated_at'>;

// ─── food_equivalencies ───

export interface DbFoodEquivalency {
  id: string;
  summary_group: string;
  food_name: string;
  portion_desc: string;
  portion_grams: number | null;
  notes: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DbFoodEquivalencyInsert = Omit<DbFoodEquivalency, 'id' | 'created_at' | 'updated_at'>;
export type DbFoodEquivalencyUpdate = Partial<Omit<DbFoodEquivalencyInsert, 'summary_group'>>;

// ─── plan_template_slides ───

export interface DbPlanTemplateSlide {
  id: string;
  title: string;
  category: string;
  content: {
    heading: string;
    body?: string;
    bullets?: string[];
    imageHint?: string;
    backgroundColor?: string;
  };
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── generated_plans ───

export interface WeightGoal {
  date: string;
  targetWeight: number;
}

export interface DbGeneratedPlan {
  id: string;
  patient_id: string;
  formula_session_id: string;
  meal_distribution_id: string;
  plan_title: string;
  objective_text: string;
  duration_months: number;
  weight_loss_per_month: number;
  weight_goals: WeightGoal[];
  template_slide_ids: string[];
  generated_at: string;
}

export type DbGeneratedPlanInsert = Omit<DbGeneratedPlan, 'id' | 'generated_at'>;
