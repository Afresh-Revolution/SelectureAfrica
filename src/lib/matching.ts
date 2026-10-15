export type MatchInput = {
  skills: string[];
  industries: string[];
  experienceYears: number | null;
  city: string | null;
  country: string | null;
  diaspora: boolean;
};

export type JobMatchInput = {
  skills: string[];
  industries: string[];
  minExperience: number | null;
  city: string | null;
  country: string | null;
  diasporaPreferred: boolean;
};

export type MatchResult = {
  score: number;
  reasons: string[];
};

function norm(values: string[]) {
  return values.map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function overlap(left: string[], right: string[]) {
  const wanted = new Set(norm(right));
  if (!wanted.size) return [];
  return norm(left).filter((value) => wanted.has(value));
}

export function scoreMatch(profile: MatchInput, job: JobMatchInput): MatchResult {
  const reasons: string[] = [];
  let score = 0;
  const sharedSkills = overlap(profile.skills, job.skills);
  if (job.skills.length) {
    const ratio = sharedSkills.length / job.skills.length;
    const skillPoints = Math.round(ratio * 45);
    score += skillPoints;
    if (sharedSkills.length) reasons.push(`Skills in common: ${sharedSkills.slice(0, 4).join(", ")}`);
    else reasons.push("No listed skill overlaps this role");
  } else {
    score += 18;
  }

  const sharedIndustries = overlap(profile.industries, job.industries);
  if (sharedIndustries.length) {
    score += 15;
    reasons.push(`Industry overlap: ${sharedIndustries.slice(0, 2).join(", ")}`);
  }

  if (job.country && profile.country && job.country.toLowerCase() === profile.country.toLowerCase()) {
    score += 12;
    reasons.push(`Based in ${profile.country}`);
  }
  if (job.city && profile.city && job.city.toLowerCase() === profile.city.toLowerCase()) {
    score += 8;
    reasons.push(`Same city: ${profile.city}`);
  }

  if (job.minExperience != null && profile.experienceYears != null) {
    const gap = profile.experienceYears - job.minExperience;
    if (gap >= 0 && gap <= 12) {
      score += 15;
      reasons.push(`${profile.experienceYears} years meets the ${job.minExperience}-year minimum`);
    } else if (gap >= -2) {
      score += 7;
      reasons.push("Experience is close to the stated minimum");
    }
  } else if (profile.experienceYears != null) {
    score += 6;
  }

  if (job.diasporaPreferred && profile.diaspora) {
    score += 5;
    reasons.push("Diaspora experience is relevant to this role");
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

export function anonymousLabel(profileId: string) {
  let hash = 0;
  for (const char of profileId) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return `Candidate ${hash.toString(16).slice(0, 4).toUpperCase()}`;
}
