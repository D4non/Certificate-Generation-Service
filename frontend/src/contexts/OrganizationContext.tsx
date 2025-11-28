import React, { createContext, useContext, useState, useEffect } from 'react';
import { Organization, getOrganizationById } from '../config/organizations';
import { useAuth } from './AuthContext';

interface OrganizationContextType {
  organization: Organization | null;
  setOrganization: (org: Organization | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { organizationId } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    // Загружаем организацию из localStorage или из AuthContext
    const orgId = organizationId || localStorage.getItem('organization') || 'fund';
    const org = getOrganizationById(orgId);
    if (org) {
      setOrganization(org);
      // Применяем цвета организации к CSS переменным
      document.documentElement.style.setProperty('--org-primary', org.primaryColor);
      document.documentElement.style.setProperty('--org-accent', org.accentColor);
    }
  }, [organizationId]);

  const handleSetOrganization = (org: Organization | null) => {
    setOrganization(org);
    if (org) {
      localStorage.setItem('organization', org.id);
      document.documentElement.style.setProperty('--org-primary', org.primaryColor);
      document.documentElement.style.setProperty('--org-accent', org.accentColor);
    } else {
      localStorage.removeItem('organization');
      document.documentElement.style.removeProperty('--org-primary');
      document.documentElement.style.removeProperty('--org-accent');
    }
  };

  return (
    <OrganizationContext.Provider value={{ organization, setOrganization: handleSetOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

