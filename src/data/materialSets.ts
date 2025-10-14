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
      { name: 'Fiber Optic Cable (Airtel)', unit: 'm' },
      { name: 'Copper Wire (Airtel)', unit: 'm' },
      { name: 'RJ45 Connectors (Airtel)', unit: 'pieces' },
      { name: 'Network Switches (Airtel)', unit: 'units' },
      { name: 'Cable Ties (Airtel)', unit: 'pieces' },
      { name: 'Cable Trays (Airtel)', unit: 'm' },
      { name: 'Patch Panels (Airtel)', unit: 'units' },
      { name: 'Cable Testers (Airtel)', unit: 'units' },
      { name: 'Crimping Tools (Airtel)', unit: 'units' },
      { name: 'Cable Markers (Airtel)', unit: 'pieces' },
      { name: 'Airtel Router (Airtel)', unit: 'units' },
      { name: 'Airtel Modem (Airtel)', unit: 'units' },
      { name: 'Airtel Antenna (Airtel)', unit: 'units' },
      { name: 'Power Adapter (Airtel)', unit: 'units' },
      { name: 'Ethernet Cable (Airtel)', unit: 'm' },
      { name: 'Splitter (Airtel)', unit: 'pieces' },
      { name: 'Coupler(Airtel)', unit: 'pieces' },
      { name: 'Terminal Block (Airtel)', unit: 'pieces' },
      { name: 'Distribution Box (Airtel)', unit: 'units' },
      { name: 'Grounding Wire (Airtel)', unit: 'm' }
    ]
  },
  {
    id: 'jio',
    name: 'Jio',
    description: 'Jio telecommunications equipment and materials',
    materials: [
      { name: 'Fiber Optic Cable (Jio)', unit: 'm' },
      { name: 'Copper Wire (Jio)', unit: 'm' },
      { name: 'RJ45 Connectors (Jio)', unit: 'pieces' },
      { name: 'Network Switches (Jio)', unit: 'units' },
      { name: 'Cable Ties (Jio)', unit: 'pieces' },
      { name: 'Cable Trays (Jio)', unit: 'm' },
      { name: 'Patch Panels (Jio)', unit: 'units' },
      { name: 'Cable Testers (Jio)', unit: 'units' },
      { name: 'Crimping Tools (Jio)', unit: 'units' },
      { name: 'Cable Markers (Jio)', unit: 'pieces' },
      { name: 'Jio Router (Jio)', unit: 'units' },
      { name: 'Jio Modem (Jio)', unit: 'units' },
      { name: 'Jio Antenna (Jio)', unit: 'units' },
      { name: 'Power Adapter (Jio)', unit: 'units' },
      { name: 'Ethernet Cable (Jio)', unit: 'm' },
      { name: 'Splitter (Jio)', unit: 'pieces' },
      { name: 'Coupler (Jio)', unit: 'pieces' },
      { name: 'Terminal Block (Jio)', unit: 'pieces' },
      { name: 'Distribution Box (Jio)', unit: 'units' },
      { name: 'Grounding Wire (Jio)', unit: 'm' }
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
