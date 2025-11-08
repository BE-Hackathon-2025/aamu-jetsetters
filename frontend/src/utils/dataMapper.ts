export function mapRiskLevelToFrontend(level: string): 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical' {
  const mapping: Record<string, 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical'> = {
    stable: 'Low Risk',
    low: 'Medium Risk',
    moderate: 'High Risk',
    high: 'High Risk',
    critical: 'Critical',
  };
  
  return mapping[level.toLowerCase()] || 'Low Risk';
}

export function mapRiskLevelToRiskIndexCard(level: string): 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Critical Risk' {
  const mapping: Record<string, 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Critical Risk'> = {
    stable: 'Low Risk',
    low: 'Moderate Risk',
    moderate: 'Moderate Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
  };
  
  return mapping[level.toLowerCase()] || 'Low Risk';
}

export function mapStatusToFrontend(status: string): 'Normal' | 'Warning' | 'Anomaly' {
  const mapping: Record<string, 'Normal' | 'Warning' | 'Anomaly'> = {
    normal: 'Normal',
    warning: 'Warning',
    anomaly: 'Anomaly',
  };
  
  return mapping[status.toLowerCase()] || 'Normal';
}

export function getChemicalIcon(parameter: string): string {
  const iconMap: Record<string, string> = {
    chlorine: 'droplet',
    pH: 'balance',
    turbidity: 'cloud',
    temperature: 'thermometer',
    lead: 'atoms',
  };
  
  return iconMap[parameter.toLowerCase()] || 'droplet';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

