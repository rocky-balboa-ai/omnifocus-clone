export interface ParsedInterval {
  value: number;
  unit: 'd' | 'w' | 'm' | 'y';
}

export function parseInterval(interval: string): ParsedInterval {
  const match = interval.match(/^(\d+)(d|w|m|y)$/);
  if (!match) {
    throw new Error(`Invalid interval format: ${interval}`);
  }

  return {
    value: parseInt(match[1], 10),
    unit: match[2] as ParsedInterval['unit'],
  };
}

export function addInterval(date: Date, interval: ParsedInterval): Date {
  const result = new Date(date);

  switch (interval.unit) {
    case 'd':
      result.setDate(result.getDate() + interval.value);
      break;
    case 'w':
      result.setDate(result.getDate() + interval.value * 7);
      break;
    case 'm':
      result.setMonth(result.getMonth() + interval.value);
      break;
    case 'y':
      result.setFullYear(result.getFullYear() + interval.value);
      break;
  }

  return result;
}

export function formatInterval(interval: ParsedInterval): string {
  const unitNames: Record<ParsedInterval['unit'], string> = {
    d: 'day',
    w: 'week',
    m: 'month',
    y: 'year',
  };

  const unit = unitNames[interval.unit];
  return `${interval.value} ${unit}${interval.value > 1 ? 's' : ''}`;
}
