import type { Report } from '../../db/schema/reports.js';
import type { Urgency } from '../../utils/helpers.js';
import { parseLocation, calculateDistance, type GeoPoint } from '../../utils/geo.js';

interface UrgencyConfig {
  low: number;
  medium: number;
  high: number;
}

const URGENCY_WEIGHTS: UrgencyConfig = {
  low: 1,
  medium: 2,
  high: 3,
};

const TIME_DECAY_FACTOR = 0.1;
const SIMILAR_REPORT_BOOST = 0.5;
const MAX_PRIORITY_SCORE = 100;

export function calculateUrgencyScore(
  report: Report,
  nearbyReports: Report[],
  currentTime: Date = new Date()
): number {
  const urgencyWeight = URGENCY_WEIGHTS[report.urgency as Urgency];
  
  const timeSinceReport = currentTime.getTime() - new Date(report.createdAt).getTime();
  const hoursSinceReport = timeSinceReport / (1000 * 60 * 60);
  const timeDecay = Math.exp(-TIME_DECAY_FACTOR * hoursSinceReport);
  
  let similarityBoost = 0;
  if (report.category) {
    const similarReports = nearbyReports.filter(
      r => r.category === report.category && r.id !== report.id
    );
    similarityBoost = similarReports.length * SIMILAR_REPORT_BOOST;
  }
  
  const rawScore = (urgencyWeight * 10 + similarityBoost) * timeDecay;
  const normalizedScore = Math.min(MAX_PRIORITY_SCORE, rawScore);
  
  return Math.round(normalizedScore * 100) / 100;
}

export function determinePriority(urgencyScore: number, threshold: number = 50): boolean {
  return urgencyScore >= threshold;
}

export function calculateBatchUrgencyScores(reports: Report[]): Report[] {
  const reportsWithScores = reports.map(report => {
    const nearbyReports = reports.filter(
      r => r.id !== report.id && r.category === report.category
    );
    const score = calculateUrgencyScore(report, nearbyReports);
    const isPriority = determinePriority(score);
    
    return {
      ...report,
      urgencyScore: score,
      isPriority,
    };
  });

  return reportsWithScores.sort((a, b) => b.urgencyScore - a.urgencyScore);
}

export function getTopPriorityReports(reports: Report[], count: number = 10): Report[] {
  const scored = calculateBatchUrgencyScores(reports);
  return scored.slice(0, count);
}