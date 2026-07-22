export interface ExchangeSummaryGroup {
  id: string;
  label: string;
  subgroupIds: string[];
  calorieRange: string;
}

export const EXCHANGE_SUMMARY_GROUPS: ExchangeSummaryGroup[] = [
  {
    id: 'sustitutos-lacteos',
    label: 'Sustitutos y lácteos',
    subgroupIds: ['III-3', 'IV-3'],
    calorieRange: '77 a 82 calorías',
  },
  {
    id: 'carnes-magras',
    label: 'Carnes magras',
    subgroupIds: ['IV-1'],
    calorieRange: '108 calorías',
  },
  {
    id: 'harinas-tuberculos-granos',
    label: 'Harinas, tubérculos y granos',
    subgroupIds: ['I-1', 'I-2', 'IV-4'],
    calorieRange: '94 a 158 calorías',
  },
  {
    id: 'grasas',
    label: 'Grasas',
    subgroupIds: ['V-1', 'V-2', 'V-3'],
    calorieRange: '42 a 47 calorías',
  },
  {
    id: 'frutas',
    label: 'Frutas',
    subgroupIds: ['II-2'],
    calorieRange: '60 calorías',
  },
  {
    id: 'verduras',
    label: 'Verduras y hortalizas',
    subgroupIds: ['II-1'],
    calorieRange: '30 calorías',
  },
  {
    id: 'dulces',
    label: 'Dulces',
    subgroupIds: ['VI-1'],
    calorieRange: '90 calorías',
  },
];
