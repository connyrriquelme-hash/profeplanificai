import { PageHeader } from '../../ui/PageHeader';
import { LayoutDashboard } from 'lucide-react';

interface CoordinatorDashboardHeaderProps {
  academicYearName?: string;
  termName?: string;
}

export default function CoordinatorDashboardHeader({
  academicYearName,
  termName,
}: CoordinatorDashboardHeaderProps) {
  const yearText = academicYearName ? `Año lectivo ${academicYearName}` : 'Año lectivo no seleccionado';
  const termText = termName ? ` · ${termName}` : '';
  return (
    <PageHeader
      icon={LayoutDashboard}
      iconColor="#7c3aed"
      title="Coordinación Académica"
      description={`${yearText}${termText}`}
      badgeColor="violet"
      aria-label="Encabezado del dashboard de coordinación académica"
    />
  );
}
