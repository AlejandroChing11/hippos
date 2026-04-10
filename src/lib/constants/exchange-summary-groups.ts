export interface ExchangeSummaryGroup {
  id: string;
  label: string;
  subgroupIds: string[];
}

export const EXCHANGE_SUMMARY_GROUPS: ExchangeSummaryGroup[] = [
  {
    id: 'sustitutos-lacteos',
    label: 'Sustitutos y lácteos',
    subgroupIds: ['III-3', 'IV-3'],
  },
  {
    id: 'carnes-magras',
    label: 'Carnes magras',
    subgroupIds: ['IV-1'],
  },
  {
    id: 'harinas-tuberculos-granos',
    label: 'Harinas, tubérculos y granos',
    subgroupIds: ['I-1', 'I-2', 'IV-4'],
  },
  {
    id: 'grasas',
    label: 'Grasas',
    subgroupIds: ['V-1', 'V-2', 'V-3'],
  },
  {
    id: 'frutas',
    label: 'Frutas',
    subgroupIds: ['II-2'],
  },
  {
    id: 'verduras',
    label: 'Verduras y hortalizas',
    subgroupIds: ['II-1'],
  },
  {
    id: 'dulces',
    label: 'Dulces',
    subgroupIds: ['VI-1'],
  },
];
