import type { SachoRecord } from './SachoRecord.js';

export class SachoBook {
  private records: SachoRecord[] = [];

  public addRecord(record: SachoRecord): void {
    this.records.push(record);
  }

  public getAll(): readonly SachoRecord[] {
    return this.records;
  }

  public getByDay(day: number): SachoRecord[] {
    return this.records.filter((r) => r.day === day);
  }

  public getBySubject(subjectId: string): SachoRecord[] {
    return this.records.filter((r) => r.subjectId === subjectId);
  }

  public getCount(): number {
    return this.records.length;
  }
}
