export interface SilokShareData {
  version: number;
  seed: string | number;
  day: number;
  generation: number;
  kingName: string;
  scribeStats: {
    integrity: number;
    peril: number;
    wealth: number;
  };
  records: Array<{
    day: number;
    subjectName: string;
    certainty: string;
    statement: string;
    witnessType: string;
  }>;
  secretArchive: Array<{
    day: number;
    title: string;
    content: string;
  }>;
  butterflies: Array<{
    day: number;
    headline: string;
    detail: string;
  }>;
  evaluation?: {
    grade: string;
    title: string;
    score: number;
    summary: string;
  };
}

export class SilokCodec {
  public static encode(data: SilokShareData): string {
    try {
      const minified = {
        v: data.version || 1,
        s: data.seed,
        d: data.day,
        g: data.generation,
        k: data.kingName,
        st: [data.scribeStats.integrity, data.scribeStats.peril, data.scribeStats.wealth],
        r: data.records.map((r) => [r.day, r.subjectName, r.certainty, r.statement, r.witnessType]),
        a: data.secretArchive.map((a) => [a.day, a.title, a.content]),
        b: data.butterflies.map((b) => [b.day, b.headline, b.detail]),
        e: data.evaluation
          ? [data.evaluation.grade, data.evaluation.title, data.evaluation.score, data.evaluation.summary]
          : null,
      };

      const jsonStr = JSON.stringify(minified);
      return this.toBase64Url(jsonStr);
    } catch (err) {
      console.error('Silok encode error:', err);
      return '';
    }
  }

  public static decode(hash: string): SilokShareData | null {
    try {
      const cleaned = hash.replace(/^#silok=/, '').replace(/^#/, '');
      if (!cleaned) return null;

      const jsonStr = this.fromBase64Url(cleaned);
      const parsed = JSON.parse(jsonStr);

      if (!parsed || parsed.v !== 1) {
        // Fallback or incompatible
      }

      return {
        version: parsed.v || 1,
        seed: parsed.s,
        day: parsed.d || 1,
        generation: parsed.g || 1,
        kingName: parsed.k || '성종 (成宗)',
        scribeStats: {
          integrity: parsed.st ? parsed.st[0] : 70,
          peril: parsed.st ? parsed.st[1] : 15,
          wealth: parsed.st ? parsed.st[2] : 20,
        },
        records: Array.isArray(parsed.r)
          ? parsed.r.map((row: any[]) => ({
              day: row[0],
              subjectName: row[1],
              certainty: row[2],
              statement: row[3],
              witnessType: row[4],
            }))
          : [],
        secretArchive: Array.isArray(parsed.a)
          ? parsed.a.map((row: any[]) => ({
              day: row[0],
              title: row[1],
              content: row[2],
            }))
          : [],
        butterflies: Array.isArray(parsed.b)
          ? parsed.b.map((row: any[]) => ({
              day: row[0],
              headline: row[1],
              detail: row[2],
            }))
          : [],
        evaluation: parsed.e
          ? {
              grade: parsed.e[0],
              title: parsed.e[1],
              score: parsed.e[2],
              summary: parsed.e[3],
            }
          : undefined,
      };
    } catch (err) {
      console.warn('Silok decode error:', err);
      return null;
    }
  }

  private static toBase64Url(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private static fromBase64Url(base64Url: string): string {
    let standard = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (standard.length % 4 !== 0) {
      standard += '=';
    }
    const bin = atob(standard);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
}
