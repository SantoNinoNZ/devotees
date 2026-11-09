import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {
  StoriesBar,
  calculateDaysToGo,
  getStoriesConfig,
  DEFAULT_NOVENA_DAY,
  DEFAULT_TOTAL_NOVENA_DAYS,
  DEFAULT_NOVENA_THEME,
  DEFAULT_FIESTA_TARGET_DATE,
  type StoriesBarProps,
} from '../../src/components/feed/StoriesBar';

describe('StoriesBar Constants and Defaults', () => {
  it('defines liturgical defaults correctly', () => {
    assert.equal(DEFAULT_NOVENA_DAY, 3);
    assert.equal(DEFAULT_TOTAL_NOVENA_DAYS, 9);
    assert.equal(DEFAULT_NOVENA_THEME, 'Petitions');
    assert.equal(DEFAULT_FIESTA_TARGET_DATE, '2027-01-16T00:00:00.000Z');
  });
});

describe('Countdown Calculation Logic', () => {
  it('calculates exactly 68 days from 2026-11-09 to 2027-01-16', () => {
    const fromDate = '2026-11-09T00:00:00.000Z';
    const targetDate = '2027-01-16T00:00:00.000Z';
    const days = calculateDaysToGo(targetDate, fromDate);
    assert.equal(days, 68);
  });

  it('works with Date objects as arguments', () => {
    const fromDate = new Date('2026-12-01T00:00:00.000Z');
    const targetDate = new Date('2027-01-16T00:00:00.000Z');
    const days = calculateDaysToGo(targetDate, fromDate);
    assert.equal(days, 46);
  });

  it('returns 0 when target date is in the past', () => {
    const fromDate = '2027-02-01T00:00:00.000Z';
    const targetDate = '2027-01-16T00:00:00.000Z';
    const days = calculateDaysToGo(targetDate, fromDate);
    assert.equal(days, 0);
  });

  it('handles invalid date strings gracefully without throwing', () => {
    const days = calculateDaysToGo('invalid-date', 'not-a-date');
    assert.equal(days, 0);
  });
});

describe('getStoriesConfig Data Structures', () => {
  it('generates 4 default story cards', () => {
    const stories = getStoriesConfig();
    assert.equal(stories.length, 4);

    const [novena, gospel, fiesta, share] = stories;

    // Card 1: Novena
    assert.equal(novena.id, 'novena');
    assert.equal(novena.tag, 'Daily Novena');
    assert.equal(novena.title, 'Day 3 of 9');
    assert.equal(novena.subtitle, 'Petitions');
    assert.equal(novena.icon, '📿');
    assert.ok(novena.gradientClass.includes('from-amber-500'));
    assert.ok(novena.gradientClass.includes('to-red-900'));

    // Card 2: Daily Gospel
    assert.equal(gospel.id, 'gospel');
    assert.equal(gospel.tag, 'Sacred Word');
    assert.equal(gospel.title, 'Daily Gospel');
    assert.equal(gospel.subtitle, 'Luke 18:15');
    assert.equal(gospel.icon, '📖');
    assert.ok(gospel.gradientClass.includes('from-blue-500'));
    assert.ok(gospel.gradientClass.includes('to-slate-900'));

    // Card 3: Fiesta Countdown
    assert.equal(fiesta.id, 'fiesta');
    assert.equal(fiesta.tag, 'Countdown');
    assert.equal(fiesta.title, 'Fiesta 2027');
    assert.equal(fiesta.subtitle, '68 Days to go');
    assert.equal(fiesta.icon, '🎉');
    assert.ok(fiesta.gradientClass.includes('from-rose-500'));
    assert.ok(fiesta.gradientClass.includes('to-purple-950'));

    // Card 4: Share Devotion
    assert.equal(share.id, 'share');
    assert.equal(share.title, 'Share Reflection');
    assert.ok(share.gradientClass.includes('border-dashed'));
    assert.ok(share.gradientClass.includes('border-stone-300'));
  });

  it('reflects customized novena progress and countdown parameters', () => {
    const stories = getStoriesConfig({
      currentNovenaDay: 7,
      totalNovenaDays: 9,
      novenaTheme: 'Thanksgiving & Youth',
      fiestaDaysToGo: 12,
    });

    const [novena, , fiesta] = stories;
    assert.equal(novena.title, 'Day 7 of 9');
    assert.equal(novena.subtitle, 'Thanksgiving & Youth');
    assert.equal(fiesta.subtitle, '12 Days to go');
  });
});

describe('StoriesBar Component Structure and Callbacks', () => {
  it('renders a valid React element with expected props', () => {
    let novenaOpenedDay: number | null = null;
    let gospelOpened = false;
    let fiestaOpened = false;
    let reflectionOpened = false;

    const props: StoriesBarProps = {
      currentNovenaDay: 4,
      totalNovenaDays: 9,
      novenaTheme: 'Healing & Protection',
      fiestaCountdownDays: 60,
      onOpenNovena: (day) => {
        novenaOpenedDay = day;
      },
      onOpenGospel: () => {
        gospelOpened = true;
      },
      onOpenFiestaCountdown: () => {
        fiestaOpened = true;
      },
      onShareReflection: () => {
        reflectionOpened = true;
      },
    };

    const element = StoriesBar(props);
    assert.ok(React.isValidElement(element));

    // Verify root styling includes rounded container and border
    const rootProps = element.props as { className?: string; children: React.ReactNode[] };
    assert.ok(rootProps.className?.includes('rounded-2xl'));
    assert.ok(rootProps.className?.includes('border-[#EFEAE2]'));

    // Verify header and stories container children exist
    const [header, scrollContainer] = rootProps.children as [React.ReactElement, React.ReactElement];
    assert.ok(React.isValidElement(header));
    assert.ok(React.isValidElement(scrollContainer));

    // Scroll container should have touch-snap and scrollbar hiding classes
    const scrollProps = scrollContainer.props as {
      className?: string;
      children: React.ReactElement<{ onClick?: () => void }>[];
    };
    assert.ok(scrollProps.className?.includes('snap-x'));
    assert.ok(scrollProps.className?.includes('snap-mandatory'));
    assert.ok(scrollProps.className?.includes('custom-scrollbar'));

    // Should have 4 story cards
    const cards = scrollProps.children;
    assert.equal(cards.length, 4);

    // Test card 1 (Novena) onClick triggers callback with correct day
    cards[0].props.onClick?.();
    assert.equal(novenaOpenedDay, 4);

    // Test card 2 (Gospel) onClick
    cards[1].props.onClick?.();
    assert.equal(gospelOpened, true);

    // Test card 3 (Fiesta) onClick
    cards[2].props.onClick?.();
    assert.equal(fiestaOpened, true);

    // Test card 4 (Share) onClick
    cards[3].props.onClick?.();
    assert.equal(reflectionOpened, true);
  });
});
