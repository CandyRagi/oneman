export interface Material {
  id: string;
  name: string;
  unit: string;
  amount: number;
  location: string;
  company?: string; // Optional company field for site materials
}

export interface MaterialSet {
  id: string;
  name: string;
  description: string;
  materials: Omit<Material, 'id' | 'amount' | 'location'>[];
}

export const MATERIAL_SETS: MaterialSet[] = [
  {
    id: 'airtel',
    name: 'Airtel',
    description: 'Airtel telecommunications equipment and materials',
    materials: [
      { name: 'Fiber Optic Cable', unit: 'm' },
      { name: 'Copper Wire', unit: 'm' },
      { name: 'RJ45 Connectors', unit: 'pieces' },
      { name: 'Network Switches', unit: 'units' },
      { name: 'Cable Ties', unit: 'pieces' },
      { name: 'Cable Trays', unit: 'm' },
      { name: 'Patch Panels', unit: 'units' },
      { name: 'Cable Testers', unit: 'units' },
      { name: 'Crimping Tools', unit: 'units' },
      { name: 'Cable Markers', unit: 'pieces' },
      { name: 'Airtel Router', unit: 'units' },
      { name: 'Airtel Modem', unit: 'units' },
      { name: 'Airtel Antenna', unit: 'units' },
      { name: 'Power Adapter', unit: 'units' },
      { name: 'Ethernet Cable', unit: 'm' },
      { name: 'Splitter', unit: 'pieces' },
      { name: 'Coupler', unit: 'pieces' },
      { name: 'Terminal Block', unit: 'pieces' },
      { name: 'Distribution Box', unit: 'units' },
      { name: 'Grounding Wire', unit: 'm' }
    ]
  },
  {
    id: 'jio',
    name: 'Jio',
    description: 'Jio telecommunications equipment and materials',
    materials: [
      { name: 'Fiber Optic Cable', unit: 'm' },
      { name: 'Copper Wire', unit: 'm' },
      { name: 'RJ45 Connectors', unit: 'pieces' },
      { name: 'Network Switches', unit: 'units' },
      { name: 'Cable Ties', unit: 'pieces' },
      { name: 'Cable Trays', unit: 'm' },
      { name: 'Patch Panels', unit: 'units' },
      { name: 'Cable Testers', unit: 'units' },
      { name: 'Crimping Tools', unit: 'units' },
      { name: 'Cable Markers', unit: 'pieces' },
      { name: 'Jio Router', unit: 'units' },
      { name: 'Jio Modem', unit: 'units' },
      { name: 'Jio Antenna', unit: 'units' },
      { name: 'Power Adapter', unit: 'units' },
      { name: 'Ethernet Cable', unit: 'm' },
      { name: 'Splitter', unit: 'pieces' },
      { name: 'Coupler', unit: 'pieces' },
      { name: 'Terminal Block', unit: 'pieces' },
      { name: 'Distribution Box', unit: 'units' },
      { name: 'Grounding Wire', unit: 'm' }
    ]
  },
  {
    id: 'adani',
    name: 'Adani',
    description: 'Adani gas pipeline equipment and materials',
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
      { name: 'Pressure Gauges', unit: 'units' },
      { name: 'Adani Compressor', unit: 'units' },
      { name: 'Adani Meter', unit: 'units' },
      { name: 'Adani Regulator', unit: 'units' },
      { name: 'Adani Filter', unit: 'units' },
      { name: 'Adani Control Valve', unit: 'units' }
    ]
  },
  {
    id: 'reliance',
    name: 'Reliance',
    description: 'Reliance gas pipeline equipment and materials',
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
      { name: 'Pressure Gauges', unit: 'units' },
      { name: 'Reliance Compressor', unit: 'units' },
      { name: 'Reliance Meter', unit: 'units' },
      { name: 'Reliance Regulator', unit: 'units' },
      { name: 'Reliance Filter', unit: 'units' },
      { name: 'Reliance Control Valve', unit: 'units' }
    ]
  }
];

// Category definitions
export const CATEGORIES = [
  {
    id: 'telecom',
    name: 'Telecom',
    description: 'Telecommunications equipment and materials',
    companies: ['airtel', 'jio']
  },
  {
    id: 'gaspipeline',
    name: 'Gas Pipeline',
    description: 'Gas pipeline construction and maintenance materials',
    companies: ['adani', 'reliance']
  }
];

export const getMaterialSetById = (id: string): MaterialSet | undefined => {
  return MATERIAL_SETS.find(set => set.id === id);
};

export const getAllMaterials = (): Omit<Material, 'id' | 'amount' | 'location'>[] => {
  return MATERIAL_SETS.flatMap(set => set.materials);
};
