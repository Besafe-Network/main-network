export function isAdultByDob(dob: any): boolean {
  if (!dob) return false;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) age--;
  return age >= 18;
}

export function getAgeVerifyStatus(record: any): 'unverified' | 'verified' | 'under18' | 'adult' {
  if (!record?.isAgeVerified) return 'unverified';
  if (isAdultByDob(record.dob) || record.vrchatAgeVerified === true) return 'adult';
  if (record.dob) return 'under18';
  return 'verified';
}

export function ageVerifyLabel(record: any): string {
  const status = getAgeVerifyStatus(record);
  switch (status) {
    case 'adult': return '✅ VERIFIED 18+';
    case 'under18': return '✅ VERIFIED 18-';
    case 'verified': return '✅ VERIFIED';
    default: return '❌ UNVERIFIED';
  }
}

export function ageVerifyShortLabel(record: any): string {
  const status = getAgeVerifyStatus(record);
  switch (status) {
    case 'adult': return '18+ VERIFIED';
    case 'under18': return '18- VERIFIED';
    case 'verified': return 'VERIFIED';
    default: return 'NOT VERIFIED';
  }
}
