export interface Organization {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
}

export const organizations: Record<string, Organization> = {
  foundation: {
    id: 'foundation',
    name: 'Фонд',
    primaryColor: '#4d008c',
    accentColor: '#4d008c',
  },
  lyceum: {
    id: 'lyceum',
    name: 'Лицей',
    primaryColor: '#5b1e3d',
    accentColor: '#5b1e3d',
  },
  ft: {
    id: 'ft',
    name: 'Федеральная территория',
    primaryColor: '#58a931',
    accentColor: '#58a931',
  },
  university: {
    id: 'university',
    name: 'Университет',
    primaryColor: '#16bfc2',
    accentColor: '#16bfc2',
  },
  gymnasium: {
    id: 'gymnasium',
    name: 'Гимназия',
    primaryColor: '#2a2840',
    accentColor: '#2a2840',
  },
};

export const getOrganizationById = (id: string): Organization | null => {
  return organizations[id] || null;
};

