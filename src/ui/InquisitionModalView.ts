import type { RoyalInquisition } from '../core/simulation/Engine.js';
import { SoundManager } from '../core/audio/SoundManager.js';
import { renderIcon } from './icons/Icons.js';

export interface InquisitionCallbacks {
  onChoice: (choiceId: 'CONFRONT' | 'INFORM' | 'ABDICATE') => void;
}

export class InquisitionModalView {
  private container: HTMLElement;
  private inquisition: RoyalInquisition;
  private callbacks: InquisitionCallbacks;

  constructor(
    container: HTMLElement,
    inquisition: RoyalInquisition,
    callbacks: InquisitionCallbacks
  ) {
    this.container = container;
    this.inquisition = inquisition;
    this.callbacks = callbacks;
  }

  public render(): void {
    const q = this.inquisition;

    this.container.innerHTML = `
      <div class="inquisition-backdrop">
        <div class="inquisition-modal">
          <!-- Banner Header -->
          <div class="inquisition-header">
            <div class="inquisition-seal-badge">${renderIcon('flame', { size: 28 })}</div>
            <div>
              <span class="inquisition-sub-badge">사화(士禍) 발발 · 어전 친국(親鞫)</span>
              <h2>${q.title}</h2>
            </div>
          </div>

          <!-- Body Description -->
          <div class="inquisition-body">
            <div class="inquisition-crime-dossier">
              <div class="dossier-row">
                <span class="dossier-label">고발 권신:</span>
                <span class="dossier-val-hostile">${q.instigatorName}</span>
              </div>
              <p class="inquisition-crime-text">${q.description}</p>
            </div>

            <div class="inquisition-warning-callout">
              ${renderIcon('sword', { size: 16 })}
              <span>
                어전 뜰 아래 의금부 나졸들이 형틀을 메고 둘러섰습니다. 사관의 답변 하나에 가문의 존망과 목숨이 달려 있습니다.
              </span>
            </div>

            <!-- Choices -->
            <div class="inquisition-choices-grid">
              ${q.choices
                .map(
                  (c) => `
                <button class="inquisition-choice-card" data-choice="${c.id}">
                  <div class="inquisition-choice-header">
                    <span class="choice-tag ${
                      c.id === 'CONFRONT' ? 'tag-gold' : c.id === 'INFORM' ? 'tag-danger' : 'tag-warn'
                    }">
                      ${c.id === 'CONFRONT' ? renderIcon('scale') : c.id === 'INFORM' ? renderIcon('zap') : renderIcon('shield')}
                      ${c.id === 'CONFRONT' ? '만고직필(萬古直筆)' : c.id === 'INFORM' ? '정적 밀고(密告)' : '자복 사직(自服)'}
                    </span>
                    <strong class="choice-title">${c.label}</strong>
                  </div>
                  <p class="choice-desc">${c.desc}</p>
                </button>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.querySelectorAll('.inquisition-choice-card').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const choiceId = (e.currentTarget as HTMLElement).getAttribute('data-choice') as any;
        if (choiceId) {
          SoundManager.getInstance().playStamp();
          this.callbacks.onChoice(choiceId);
        }
      });
    });
  }
}
