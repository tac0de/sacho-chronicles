export type DailyPhase =
  | 'LOCATION_SELECTION'   // 오늘 방문할 장소 선택 단계
  | 'OBSERVATION_RECORD'   // 관찰 결과 확인 및 사초 집필 단계
  | 'DAY_COMPLETED';       // 하루 정산 완료 및 익일 대기

export class TimeManager {
  private _currentDay: number = 1;
  private _currentPhase: DailyPhase = 'LOCATION_SELECTION';

  constructor(initialDay: number = 1) {
    this._currentDay = initialDay;
  }

  public get currentDay(): number {
    return this._currentDay;
  }

  public get currentPhase(): DailyPhase {
    return this._currentPhase;
  }

  public setPhase(phase: DailyPhase): void {
    this._currentPhase = phase;
  }

  public advanceToNextDay(): number {
    this._currentDay += 1;
    this._currentPhase = 'LOCATION_SELECTION';
    return this._currentDay;
  }

  public reset(day: number = 1): void {
    this._currentDay = day;
    this._currentPhase = 'LOCATION_SELECTION';
  }
}
