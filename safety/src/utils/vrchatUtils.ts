export function extractVRChatUserId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  
  // Standard VRChat User ID UUID format: usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidMatch = trimmed.match(/usr_[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/);
  if (uuidMatch) {
    return uuidMatch[0];
  }

  // Fallback match for any link containing /usr_... or starting with usr_
  const fallbackMatch = trimmed.match(/usr_[a-zA-Z0-9\-]+/);
  if (fallbackMatch) {
    return fallbackMatch[0];
  }

  return trimmed;
}

export function extractVRChatGroupId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Standard VRChat Group ID UUID format: grp_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidMatch = trimmed.match(/grp_[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/);
  if (uuidMatch) {
    return uuidMatch[0];
  }

  // Fallback match for any link containing /grp_... or starting with grp_
  const fallbackMatch = trimmed.match(/grp_[a-zA-Z0-9\-]+/);
  if (fallbackMatch) {
    return fallbackMatch[0];
  }

  return trimmed;
}
