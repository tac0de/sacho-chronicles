/**
 * 시드 기반 PRNG (Mulberry32 알고리즘)
 * 동일한 시드로 초기화하면 항상 동일한 난수 시퀀스를 보장합니다.
 */
export class Random {
  private _seed: number;
  private _state: number;

  constructor(seed: number | string = 12345) {
    this._seed = this.normalizeSeed(seed);
    this._state = this._seed;
  }

  private normalizeSeed(seed: number | string): number {
    if (typeof seed === 'number') {
      return (seed >>> 0) || 1;
    }
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
    }
    return (hash >>> 0) || 1;
  }

  public getSeed(): number {
    return this._seed;
  }

  public reseed(seed: number | string): void {
    this._seed = this.normalizeSeed(seed);
    this._state = this._seed;
  }

  /**
   * 0 이상 1 미만의 부동소수점 난수 생성 (Mulberry32)
   */
  public next(): number {
    let t = (this._state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * min 이상 max 이하의 정수 반환 (둘 다 포함)
   */
  public nextInt(min: number, max: number): number {
    if (min > max) [min, max] = [max, min];
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * min 이상 max 미만의 부동소수점 반환
   */
  public nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * 배열에서 무작위 원소 하나 선택
   */
  public pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Random.pick: 빈 배열에서 원소를 선택할 수 없습니다.');
    }
    const index = Math.floor(this.next() * array.length);
    return array[index];
  }

  /**
   * 배열을 무작위로 섞은 새 배열 반환 (Fisher-Yates)
   */
  public shuffle<T>(array: readonly T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * 확률(0.0 ~ 1.0)에 따른 boolean 반환
   */
  public chance(probability: number): boolean {
    return this.next() < probability;
  }
}
