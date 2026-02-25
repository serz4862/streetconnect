import { supabase } from './supabase.service';

/**
 * Log a dog activity entry. Never throws — activity log failures are silent
 * so they don't break the main operation.
 */
export async function logDogActivity(
  dogId: string,
  userId: string | null,
  type: string,
  title: string,
  description?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.from('dog_activity_log').insert({
      dog_id: dogId,
      user_id: userId || null,
      type,
      title,
      description: description || null,
      metadata: metadata || {},
    });
  } catch {
    // Silent — activity log is non-critical
  }
}

/**
 * Determine what fields changed between old and new dog data, and
 * return a human-readable description of the changes.
 */
export function describeChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string {
  const interesting = [
    'name', 'color', 'gender', 'breed', 'age_approx',
    'is_sterilized', 'health_status', 'health_notes',
    'location_name', 'description', 'image_url',
  ];
  const changes: string[] = [];
  for (const key of interesting) {
    if (key in after && String(before[key] ?? '') !== String(after[key] ?? '')) {
      const label = key.replace(/_/g, ' ');
      changes.push(`${label}: "${after[key]}"`);
    }
  }
  return changes.length > 0 ? changes.join(', ') : 'Info updated';
}

/**
 * Map severity/issue_type to a dog health_status value.
 */
export function issueToHealthStatus(
  severity?: string,
  issueType?: string,
): 'sick' | 'injured' | 'critical' | null {
  if (severity === 'critical' || issueType === 'abuse') return 'critical';
  if (severity === 'high' || issueType === 'injury' || issueType === 'road_accident' || issueType === 'trapped') return 'injured';
  if (issueType === 'illness' || issueType === 'starvation') return 'sick';
  if (severity === 'medium' || severity === 'low') return 'sick';
  return null;
}
