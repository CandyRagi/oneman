export interface Material {
  id: string;
  name: string;
  unit: string;
  amount: number;
  location: string;
}

export interface MaterialSet {
  id: string;
  name: string;
  description: string;
  materials: Omit<Material, 'id' | 'amount' | 'location'>[];
}

export const MATERIAL_SETS: MaterialSet[] = [
  {
    id: 'telecom',
    name: 'Telecom',
    description: 'Telecommunications equipment and materials',
    materials: [
      { name: 'Fiber Optic Cable', unit: 'km' },
      { name: 'Copper Wire', unit: 'm' },
      { name: 'RJ45 Connectors', unit: 'pieces' },
      { name: 'Network Switches', unit: 'units' },
      { name: 'Cable Ties', unit: 'pieces' },
      { name: 'Cable Trays', unit: 'm' },
      { name: 'Patch Panels', unit: 'units' },
      { name: 'Cable Testers', unit: 'units' },
      { name: 'Crimping Tools', unit: 'units' },
      { name: 'Cable Markers', unit: 'pieces' }
    ]
  },
  {
    id: 'gas-pipeline',
    name: 'Gas Pipeline',
    description: 'Gas pipeline construction and maintenance materials',
    materials: [
      { name: 'Steel Pipes', unit: 'm' },
      { name: 'Pipe Fittings', unit: 'pieces' },
      { name: 'Valves', unit: 'units' },
      { name: 'Gaskets', unit: 'pieces' },
      { name: 'Pipe Wraps', unit: 'm' },
      { name: 'Cathodic Protection', unit: 'units' },
      { name: 'Pipe Insulation', unit: 'm' },
      { name: 'Welding Rods', unit: 'kg' },
      { name: 'Pipe Supports', unit: 'pieces' },
      { name: 'Pressure Gauges', unit: 'units' }
    ]
  },
  {
    id: 'clothes',
    name: 'Clothes',
    description: 'Clothing and textile materials',
    materials: [
      { name: 'Cotton Fabric', unit: 'm' },
      { name: 'Polyester Thread', unit: 'spools' },
      { name: 'Zippers', unit: 'pieces' },
      { name: 'Buttons', unit: 'pieces' },
      { name: 'Elastic Bands', unit: 'm' },
      { name: 'Sewing Needles', unit: 'packets' },
      { name: 'Fabric Scissors', unit: 'units' },
      { name: 'Measuring Tape', unit: 'units' },
      { name: 'Iron', unit: 'units' },
      { name: 'Sewing Machine', unit: 'units' }
    ]
  }
];

export const getMaterialSetById = (id: string): MaterialSet | undefined => {
  return MATERIAL_SETS.find(set => set.id === id);
};

export const getAllMaterials = (): Omit<Material, 'id' | 'amount' | 'location'>[] => {
  return MATERIAL_SETS.flatMap(set => set.materials);
};
