export type Factor = { label: string; score: number; note: string };

export type AssessmentResult = {
  score: number;
  band: string;
  narrative: string;
  factors: Factor[];
};

function bandFor(score: number) {
  if (score >= 80) return "Strong fit";
  if (score >= 65) return "Promising";
  if (score >= 45) return "Developing";
  return "Limited";
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function assessFit(input: {
  matchScore: number | null;
  experienceYears: number | null;
  minExperience: number | null;
  examAverage: number | null;
  lessonsCompleted: number;
  lessonsTotal: number;
  roleTitle?: string | null;
}): AssessmentResult {
  const factors: Factor[] = [];

  if (input.matchScore != null) {
    factors.push({
      label: "Role match",
      score: input.matchScore,
      note: input.matchScore >= 70 ? "The profile covers most of what the role asks for." : "Several role requirements are still thin.",
    });
  } else {
    const breadth = input.experienceYears == null ? 40 : Math.min(90, 35 + input.experienceYears * 4);
    factors.push({
      label: "Market readiness",
      score: breadth,
      note: "Read from years of experience, because this assessment is not tied to one role.",
    });
  }

  if (input.minExperience != null && input.experienceYears != null) {
    const gap = input.experienceYears - input.minExperience;
    const score = gap >= 0 ? 85 : gap >= -2 ? 60 : 35;
    factors.push({
      label: "Experience",
      score,
      note: gap >= 0 ? "Experience meets the minimum." : "Experience sits below the minimum.",
    });
  }

  const learningScore =
    input.lessonsTotal === 0 ? 50 : clamp((input.lessonsCompleted / input.lessonsTotal) * 100);
  factors.push({
    label: "Learning evidence",
    score: input.examAverage != null ? clamp(learningScore * 0.5 + input.examAverage * 0.5) : learningScore,
    note:
      input.examAverage != null
        ? `Latest checks average ${input.examAverage}%.`
        : input.lessonsTotal
          ? `${input.lessonsCompleted} of ${input.lessonsTotal} lessons completed.`
          : "No lessons are on record yet.",
  });

  const score = clamp(factors.reduce((sum, factor) => sum + factor.score, 0) / factors.length);
  const band = bandFor(score);
  const strongest = [...factors].sort((a, b) => b.score - a.score)[0];
  const weakest = [...factors].sort((a, b) => a.score - b.score)[0];
  const subject = input.roleTitle ? `for ${input.roleTitle}` : "against the current market";
  const narrative = `${band} ${subject}. The strongest signal is ${strongest.label.toLowerCase()} (${strongest.score}). The point to test in conversation is ${weakest.label.toLowerCase()} (${weakest.score}). This reading uses the profile, the role where one is attached, and learning evidence. It is a recommendation, not a hiring decision.`;

  return { score, band, narrative, factors };
}
