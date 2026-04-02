export interface FoodSubgroup {
  id: string;
  name: string;
  protein: number;
  fat: number;
  carbs: number;
  kcalPerExchange: number;
}

export interface FoodGroup {
  id: string;
  name: string;
  subgroups: FoodSubgroup[];
}

function sub(id: string, name: string, protein: number, fat: number, carbs: number): FoodSubgroup {
  return { id, name, protein, fat, carbs, kcalPerExchange: protein * 4 + fat * 9 + carbs * 4 };
}

export const FOOD_GROUPS: FoodGroup[] = [
  {
    id: 'I',
    name: 'Cereales, raíces y tubérculos',
    subgroups: [
      sub('I-1', 'Cereales', 2.5, 1.0, 18.7),
      sub('I-2', 'Raíces, tubérculos y plátanos', 1.4, 0.1, 22.3),
    ],
  },
  {
    id: 'II',
    name: 'Frutas y verduras',
    subgroups: [
      sub('II-1', 'Verduras y hortalizas', 1.2, 0.3, 5.5),
      sub('II-2', 'Frutas', 1.0, 0.3, 13.3),
    ],
  },
  {
    id: 'III',
    name: 'Leche y productos lácteos',
    subgroups: [
      sub('III-1', 'Leche entera', 6.7, 6.7, 13.0),
      sub('III-2', 'Leche semidescremada', 5.4, 2.1, 13.5),
      sub('III-3', 'Leche descremada', 9.0, 0.7, 10.0),
      sub('III-4', 'Leche alta en calorías y azúcares', 6.4, 5.9, 23.0),
    ],
  },
  {
    id: 'IV',
    name: 'Carnes, huevos, leguminosas y frutos secos',
    subgroups: [
      sub('IV-1', 'Carnes magras', 19.1, 3.1, 1.0),
      sub('IV-2', 'Carnes altas en lípidos', 15.6, 7.9, 1.3),
      sub('IV-3', 'Sustitutos (huevos)', 5.8, 5.5, 1.1),
      sub('IV-4', 'Leguminosas cocidas', 9.8, 1.7, 25.9),
      sub('IV-5', 'Nueces', 1.3, 4.8, 2.0),
      sub('IV-6', 'Semillas', 2.3, 4.1, 3.1),
    ],
  },
  {
    id: 'V',
    name: 'Grasas',
    subgroups: [
      sub('V-1', 'Poliinsaturadas', 0.0, 4.5, 0.3),
      sub('V-2', 'Monoinsaturadas', 0.4, 4.6, 1.0),
      sub('V-3', 'Saturadas', 0.3, 4.8, 0.3),
    ],
  },
  {
    id: 'VI',
    name: 'Azúcares',
    subgroups: [
      sub('VI-1', 'Azúcares y dulces', 0.9, 1.1, 19.1),
    ],
  },
];
