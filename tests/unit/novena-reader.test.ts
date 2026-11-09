import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  NovenaReaderModal,
  NOVENA_DAYS_DATA,
  getNovenaDayData,
  formatNovenaShareText,
  calculateNovenaStreak,
  DEFAULT_AUDIO_HYMN_URL,
} from '../../src/components/prayers/NovenaReaderModal';

describe('9-Day Sacred Novena Dataset Integrity', () => {
  it('contains exactly 9 liturgical days sequentially ordered from 1 to 9', () => {
    assert.equal(NOVENA_DAYS_DATA.length, 9);
    NOVENA_DAYS_DATA.forEach((dayData, index) => {
      assert.equal(dayData.day, index + 1);
      assert.ok(dayData.title && dayData.title.length > 5);
      assert.ok(dayData.theme && dayData.theme.length > 3);
      assert.ok(dayData.openingPrayer && dayData.openingPrayer.length > 20);
      assert.ok(dayData.reflection && dayData.reflection.length > 20);
      assert.ok(dayData.closingPrayer && dayData.closingPrayer.length > 15);
      assert.ok(Array.isArray(dayData.supplications));
      assert.ok(dayData.supplications.length >= 3);
    });
  });

  it('verifies every supplication has petition text and liturgical response', () => {
    NOVENA_DAYS_DATA.forEach((dayData) => {
      dayData.supplications.forEach((supplication) => {
        assert.ok(supplication.text && supplication.text.length > 5);
        assert.equal(supplication.response, 'Hear us, O Holy Child Jesus.');
      });
    });
  });

  it('matches Day 3 petitions faithfully with prototype.html specifications', () => {
    const day3 = getNovenaDayData(3);
    assert.equal(day3.day, 3);
    assert.match(day3.title, /Day 3 of 9: Petitions for Families/i);
    assert.match(
      day3.openingPrayer,
      /O Señor Santo Niño, who in your boundless love became a humble child/i
    );
    assert.match(
      day3.openingPrayer,
      /families of our community in New Zealand and across our beloved homeland/i
    );

    // Supplications check
    const joinedSupplications = day3.supplications
      .map((s) => s.text)
      .join(' ');
    assert.match(
      joinedSupplications,
      /overseas workers and immigrants navigating life in NZ/i
    );
    assert.match(
      joinedSupplications,
      /sick, elderly, and those awaiting surgery/i
    );
    assert.match(
      joinedSupplications,
      /peace and purity in all Christian households/i
    );
  });
});

describe('Novena Day Data Resolver (getNovenaDayData)', () => {
  it('retrieves correct data for valid days 1 through 9', () => {
    for (let day = 1; day <= 9; day++) {
      const data = getNovenaDayData(day);
      assert.equal(data.day, day);
    }
  });

  it('clamps lower bounds (zero and negative days) to Day 1', () => {
    assert.equal(getNovenaDayData(0).day, 1);
    assert.equal(getNovenaDayData(-5).day, 1);
  });

  it('clamps upper bounds (days greater than 9) to Day 9', () => {
    assert.equal(getNovenaDayData(10).day, 9);
    assert.equal(getNovenaDayData(99).day, 9);
  });

  it('defaults gracefully to Day 1 on NaN or undefined inputs', () => {
    assert.equal(getNovenaDayData(Number.NaN).day, 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.equal(getNovenaDayData(undefined as any).day, 1);
  });
});

describe('Novena Share Text Formatting (formatNovenaShareText)', () => {
  it('formats standard feed share message for Day 3', () => {
    const message = formatNovenaShareText(3);
    assert.equal(
      message,
      'Just completed Day 3 of the Novena to Señor Santo Niño! Viva Pit Señor! 📿'
    );
  });

  it('formats share message with custom liturgical theme suffix', () => {
    const message = formatNovenaShareText(9, 'Viva Pit Señor');
    assert.equal(
      message,
      'Just completed Day 9 of the Novena to Señor Santo Niño! (Viva Pit Señor) Viva Pit Señor! 📿'
    );
  });

  it('safely clamps day boundaries when formatting share message', () => {
    assert.match(
      formatNovenaShareText(0),
      /Just completed Day 1 of the Novena to Señor Santo Niño!/
    );
    assert.match(
      formatNovenaShareText(100),
      /Just completed Day 9 of the Novena to Señor Santo Niño!/
    );
  });
});

describe('Streak and Progress Calculation (calculateNovenaStreak)', () => {
  it('calculates 0% completion for empty completed days', () => {
    const streak = calculateNovenaStreak([]);
    assert.equal(streak.completedCount, 0);
    assert.equal(streak.isFullNovenaCompleted, false);
    assert.equal(streak.percentage, 0);
  });

  it('calculates 33% completion for 3 distinct completed days', () => {
    const streak = calculateNovenaStreak([1, 2, 3]);
    assert.equal(streak.completedCount, 3);
    assert.equal(streak.isFullNovenaCompleted, false);
    assert.equal(streak.percentage, 33);
  });

  it('deduplicates duplicate day entries correctly', () => {
    const streak = calculateNovenaStreak([1, 1, 2, 2, 3, 3, 3]);
    assert.equal(streak.completedCount, 3);
    assert.equal(streak.percentage, 33);
  });

  it('filters out invalid or out-of-range day numbers', () => {
    const streak = calculateNovenaStreak([0, 1, 2, 15, -3, 3]);
    assert.equal(streak.completedCount, 3);
    assert.equal(streak.percentage, 33);
  });

  it('detects 100% full novena completion when all 9 days are completed', () => {
    const streak = calculateNovenaStreak([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assert.equal(streak.completedCount, 9);
    assert.equal(streak.isFullNovenaCompleted, true);
    assert.equal(streak.percentage, 100);
  });
});

describe('NovenaReaderModal Component Markup & Accessibility', () => {
  it('renders nothing when isOpen is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(NovenaReaderModal, {
        isOpen: false,
        onClose: () => {},
      })
    );
    assert.equal(html, '');
  });

  it('renders dialog container with accessibility attributes when isOpen is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(NovenaReaderModal, {
        isOpen: true,
        onClose: () => {},
        initialDay: 3,
        cycleYear: 2026,
      })
    );

    // Modal accessibility
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
    assert.match(html, /aria-labelledby="novena-modal-title"/);

    // Header elements
    assert.match(html, /data-testid="novena-modal-title"/);
    assert.match(html, /Novena to Señor Santo Niño/);
    assert.match(html, /📿/);
    assert.match(html, /data-testid="novena-day-subtitle"/);
    assert.match(html, /Day 3 of 9: Petitions for Families/);
    assert.match(html, /data-testid="close-novena-button"/);

    // Annual cycle badge
    assert.match(html, /Annual Cycle 2026/);
  });

  it('renders 9 visual day selector buttons in tablist with day numbers', () => {
    const html = renderToStaticMarkup(
      React.createElement(NovenaReaderModal, {
        isOpen: true,
        onClose: () => {},
        initialDay: 3,
        initialCompletedDays: [1, 2],
      })
    );

    assert.match(html, /role="tablist"/);
    for (let day = 1; day <= 9; day++) {
      assert.match(html, new RegExp(`data-testid="novena-day-btn-${day}"`));
    }

    // Days 1 and 2 should have checkmark badges
    assert.match(html, /data-testid="day-1-checkmark"/);
    assert.match(html, /data-testid="day-2-checkmark"/);

    // 2/9 Days progress text
    assert.match(html, /2\/9 Days/);
  });

  it('renders Bato Balani sa Gugma liturgical audio player elements', () => {
    const html = renderToStaticMarkup(
      React.createElement(NovenaReaderModal, {
        isOpen: true,
        onClose: () => {},
        initialDay: 3,
      })
    );

    assert.match(html, /data-testid="audio-play-btn"/);
    assert.match(html, /Bato Balani sa Gugma \(Liturgical Hymn\)/);
    assert.match(html, /data-testid="audio-status-text"/);
    assert.match(
      html,
      /Served via GitHub Pages audio streaming \(0 Supabase cost\)/
    );
    assert.match(html, /data-testid="audio-listen-badge"/);
    assert.match(html, /Listen/);
    assert.match(html, /data-testid="novena-audio-element"/);
    assert.match(
      html,
      new RegExp(
        DEFAULT_AUDIO_HYMN_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      )
    );

    // Chorus lyrics refrain
    assert.match(html, /data-testid="hymn-lyrics-refrain"/);
    assert.match(html, /Bato Balani sa gugma/);
  });

  it('renders sacred prayer sections: opening prayer, supplications, reflection, and closing prayer', () => {
    const html = renderToStaticMarkup(
      React.createElement(NovenaReaderModal, {
        isOpen: true,
        onClose: () => {},
        initialDay: 3,
      })
    );

    assert.match(html, /data-testid="opening-prayer-text"/);
    assert.match(
      html,
      /O Señor Santo Niño, who in your boundless love became a humble child/
    );

    assert.match(html, /data-testid="supplications-heading"/);
    assert.match(html, /Supplications for Day 3:/);

    assert.match(html, /data-testid="supplication-item-0"/);
    assert.match(
      html,
      /overseas workers and immigrants navigating life in NZ:/
    );
    assert.match(html, /Hear us, O Holy Child Jesus\./);

    assert.match(html, /data-testid="reflection-text"/);
    assert.match(html, /The Holy Family of Nazareth is the model/);

    assert.match(html, /data-testid="closing-prayer-text"/);
    assert.match(html, /guardian of our families/);
  });

  it('renders bottom action buttons: Mark Day as Completed and Share Streak Badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(NovenaReaderModal, {
        isOpen: true,
        onClose: () => {},
        initialDay: 3,
        initialCompletedDays: [1, 2],
      })
    );

    assert.match(html, /data-testid="mark-day-complete-btn"/);
    assert.match(html, /Mark Day 3 as Completed/);
    assert.match(html, /data-testid="share-novena-streak-btn"/);
    assert.match(html, /Share Streak Badge/);
  });

  it('displays "Day X Completed ✓" on mark button when current day is already completed', () => {
    const html = renderToStaticMarkup(
      React.createElement(NovenaReaderModal, {
        isOpen: true,
        onClose: () => {},
        initialDay: 3,
        initialCompletedDays: [1, 2, 3],
      })
    );

    assert.match(html, /Day 3 Completed ✓/);
  });
});
