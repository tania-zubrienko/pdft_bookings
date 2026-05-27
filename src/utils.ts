export const formatDate = (timestamp: unknown) => {
  if (!timestamp) return 'N/D';
  const date =
    timestamp instanceof Date ? timestamp : new Date(timestamp as string);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (timestamp: unknown) => {
  if (!timestamp) return 'N/D';
  const date =
    timestamp instanceof Date ? timestamp : new Date(timestamp as string);
  return date.toLocaleTimeString('es-ES', {
    month: '2-digit',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
