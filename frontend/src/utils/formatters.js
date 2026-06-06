export function formatRank(position) {
  if (position === 0 || position == null) return 'N/A';
  if (position === 1) return '1st';
  if (position === 2) return '2nd';
  if (position === 3) return '3rd';
  return `${position}th`;
}

export function rankBadgeClass(position) {
  if (position === 1) return '1st';
  if (position === 2) return '2nd';
  if (position === 3) return '3rd';
  return 'other';
}
