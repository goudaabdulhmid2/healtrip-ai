import { Injectable } from '@nestjs/common';

export type SafetyLevel = 'ROUTINE' | 'URGENT';

export interface SafetyAssessment {
  level: SafetyLevel;
  shouldBlockTools: boolean;
  reason?: string;
}

const urgentPatterns = [
  /severe chest pain/,
  /chest pain.*(?:difficulty breathing|shortness of breath)/,
  /(?:difficulty breathing|shortness of breath)/,
  /(?:can't|cannot) breathe/,
  /loss of consciousness/,
  /unconscious/,
  /heavy bleeding/,
  /severe bleeding/,
  /stroke symptoms/,
  /ألم\s+(?:شديد\s+)?(?:في\s+)?الصدر/,
  /ألم\s+صدر\s+شديد/,
  /صعوبة\s+شديدة\s+في\s+التنفس/,
  /لا\s+أستطيع\s+التنفس/,
  /فقدان\s+الوعي/,
  /إغماء/,
  /نزيف\s+(?:شديد|لا\s+يتوقف)/,
  /ضعف\s+مفاجئ\s+في\s+(?:جانب|جهة)\s+من\s+الجسم/,
  /فقدان\s+مفاجئ\s+للكلام/,
  /تشنج\s+شديد/,
];

const negationPattern =
  /(?:\bno\b|\bnot\b|\bwithout\b|لا\s+يوجد|لا\s+أعاني\s+من|ليس\s+لدي|ما\s+فيش|مش\s+عندي|بدون)(?:\s+\S+){0,4}\s*$/i;

@Injectable()
export class SafetyGuard {
  assess(messages: string | string[]): SafetyAssessment {
    const messageList = Array.isArray(messages) ? messages : [messages];
    const isUrgent = messageList.some((message) =>
      this.containsUrgentSignal(message),
    );

    if (isUrgent) {
      return {
        level: 'URGENT',
        shouldBlockTools: true,
        reason:
          'The message contains symptoms that may require immediate medical attention.',
      };
    }

    return { level: 'ROUTINE', shouldBlockTools: false };
  }

  private containsUrgentSignal(message: string): boolean {
    const normalized = message
      .toLowerCase()
      .normalize('NFC')
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '');

    return urgentPatterns.some((pattern) => {
      for (const match of normalized.matchAll(
        new RegExp(
          pattern.source,
          pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
        ),
      )) {
        const prefix = normalized.slice(
          Math.max(0, match.index! - 40),
          match.index,
        );
        if (!negationPattern.test(prefix.trimEnd())) return true;
      }
      return false;
    });
  }
}
