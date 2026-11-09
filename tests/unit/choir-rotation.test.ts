import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { EventWithRoster } from '../../src/types';
import {
  ChoirRotationModal,
  DEFAULT_CHOIR_ROTATION_PRESETS,
  formatLiturgicalDate,
  formatSequenceLabel,
  resolveRotationStatus,
  transformEventToRotationItem,
  resolveRotationItems,
  executeRegisterChoirAction,
  type ChoirRotationItem,
} from '../../src/components/events/ChoirRotationModal';

// ==========================================
// TEST FIXTURES & MOCKS
// ==========================================

function createMockEvent(overrides: Partial<EventWithRoster> = {}): EventWithRoster {
  return {
    id: 'evt-1',
    slug: 'novena-mass-1',
    title: 'Santo Niño Novena Mass 1',
    type: 'dated',
    recurrence: null,
    time: '5:30 PM',
    start_date: '2026-11-14',
    end_date: '2026-11-14',
    rosary_time: '5:00 PM',
    parking_info: null,
    venue: "St Benedict's Newton",
    address: '1 St Benedicts St, Auckland',
    content: null,
    published: true,
    created_at: new Date('2026-11-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-11-01T00:00:00Z').toISOString(),
    created_by: null,
    last_modified_by: null,
    category: 'mass',
    visibility: 'public',
    description: null,
    featured_image: null,
    allowed_roles: null,
    allowed_areas: null,
    allowed_groups: null,
    location_coords: null,
    is_online: false,
    online_link: null,
    event_start_date: '2026-11-14',
    event_end_date: '2026-11-14',
    event_start_time: '5:30 PM',
    event_end_time: '7:00 PM',
    is_all_day: false,
    organizer_id: null,
    presider_name: 'Rev. Fr. Mario Gomez',
    presider_id: null,
    choir_name: 'Coro de Santo Niño (North Shore)',
    choir_group_id: null,
    lectors: ['Sis Maria', 'Bro Juan'],
    acolytes_guild: 'North Shore Guild',
    sponsor_chapter: 'Pukekohe Chapter',
    mass_sequence_number: 1,
    presider: {
      id: 'pres-1',
      display_name: 'Mario Gomez',
      avatar_url: null,
    },
    choir_group: {
      id: 'grp-1',
      name: 'Coro de Santo Niño (North Shore)',
    },
    ...overrides,
  };
}

// ==========================================
// SUITE: Liturgical Presets & Defaults
// ==========================================

describe('ChoirRotationModal - Liturgical Presets', () => {
  it('contains exactly 4 default liturgical rotation presets', () => {
    assert.equal(DEFAULT_CHOIR_ROTATION_PRESETS.length, 4);
  });

  it('verifies Mass 1 preset attributes (Active Mass)', () => {
    const mass1 = DEFAULT_CHOIR_ROTATION_PRESETS[0];
    assert.equal(mass1.sequenceLabel, 'Mass 1 • Nov 14');
    assert.equal(mass1.venueDisplay, "St Benedict's Newton (5:30 PM)");
    assert.equal(mass1.choirName, 'Coro de Santo Niño (North Shore)');
    assert.equal(mass1.presiderName, 'Rev. Fr. Mario Gomez');
    assert.equal(mass1.sponsorChapter, 'Pukekohe Chapter');
    assert.equal(mass1.status, 'Assigned Active');
    assert.equal(mass1.variant, 'active');
  });

  it('verifies Mass 2 preset attributes (Upcoming Mass)', () => {
    const mass2 = DEFAULT_CHOIR_ROTATION_PRESETS[1];
    assert.equal(mass2.sequenceLabel, 'Mass 2 • Nov 21');
    assert.equal(mass2.venueDisplay, "St Patrick's Cathedral (5:30 PM)");
    assert.equal(mass2.choirName, 'Auckland Catholic Youth Choir');
    assert.equal(mass2.presiderName, 'Rev. Fr. Bernard Espiritu');
    assert.equal(mass2.sponsorChapter, 'Auckland Central');
    assert.equal(mass2.status, 'Upcoming');
    assert.equal(mass2.variant, 'upcoming');
  });

  it('verifies Mass 3 preset attributes (Upcoming Mass)', () => {
    const mass3 = DEFAULT_CHOIR_ROTATION_PRESETS[2];
    assert.equal(mass3.sequenceLabel, 'Mass 3 • Nov 28');
    assert.equal(mass3.venueDisplay, "St Benedict's Newton (5:30 PM)");
    assert.equal(mass3.choirName, 'Voices of Faith (West Auckland Chapter)');
    assert.equal(mass3.presiderName, 'Rev. Fr. Sherwin Lapaan');
    assert.equal(mass3.sponsorChapter, 'West Auckland');
    assert.equal(mass3.status, 'Upcoming');
    assert.equal(mass3.variant, 'upcoming');
  });

  it('verifies Grand Fiesta preset attributes (Combined Choirs)', () => {
    const fiesta = DEFAULT_CHOIR_ROTATION_PRESETS[3];
    assert.equal(fiesta.sequenceLabel, 'Grand Fiesta • Jan 18');
    assert.equal(fiesta.venueDisplay, 'Grand Sinulog Festival High Mass');
    assert.equal(fiesta.choirName, 'Combined NZ Sinulog Festival Choirs');
    assert.equal(fiesta.presiderName, 'Most Rev. Bishop of Auckland');
    assert.equal(fiesta.sponsorChapter, 'All NZ Chapters');
    assert.equal(fiesta.status, 'Combined Choirs');
    assert.equal(fiesta.variant, 'combined');
  });
});

// ==========================================
// SUITE: Helper Functions
// ==========================================

describe('ChoirRotationModal - Helpers', () => {
  describe('formatLiturgicalDate', () => {
    it('formats YYYY-MM-DD correctly without time shift', () => {
      assert.equal(formatLiturgicalDate('2026-11-14'), 'Nov 14');
      assert.equal(formatLiturgicalDate('2026-11-21'), 'Nov 21');
      assert.equal(formatLiturgicalDate('2027-01-18'), 'Jan 18');
      assert.equal(formatLiturgicalDate('2026-12-25'), 'Dec 25');
    });

    it('formats ISO timestamps correctly', () => {
      const res = formatLiturgicalDate('2026-11-14T05:30:00.000Z');
      assert.equal(res, 'Nov 14');
    });

    it('returns TBD for empty or invalid dates', () => {
      assert.equal(formatLiturgicalDate(null), 'TBD');
      assert.equal(formatLiturgicalDate(undefined), 'TBD');
      assert.equal(formatLiturgicalDate(''), 'TBD');
      assert.equal(formatLiturgicalDate('invalid-date-string'), 'TBD');
    });
  });

  describe('formatSequenceLabel', () => {
    it('uses mass_sequence_number when present', () => {
      const label = formatSequenceLabel(
        { title: 'Novena Mass', mass_sequence_number: 5 },
        4,
        'Dec 12'
      );
      assert.equal(label, 'Mass 5 • Dec 12');
    });

    it('falls back to index + 1 when mass_sequence_number is absent', () => {
      const label = formatSequenceLabel(
        { title: 'Novena Mass', mass_sequence_number: null },
        2,
        'Nov 28'
      );
      assert.equal(label, 'Mass 3 • Nov 28');
    });

    it('formats Grand Fiesta when title includes Grand Fiesta or Sinulog Festival', () => {
      const label1 = formatSequenceLabel(
        { title: 'Grand Sinulog Festival High Mass' },
        8,
        'Jan 18'
      );
      assert.equal(label1, 'Grand Fiesta • Jan 18');

      const label2 = formatSequenceLabel(
        { title: 'Grand Fiesta High Mass', mass_sequence_number: 10 },
        9,
        'Jan 18'
      );
      assert.equal(label2, 'Grand Fiesta • Jan 18');
    });
  });

  describe('resolveRotationStatus', () => {
    it('resolves active status for the first item (index 0)', () => {
      const { status, variant } = resolveRotationStatus(
        { title: 'Mass 1', choir_name: 'Coro de Santo Niño' },
        0
      );
      assert.equal(status, 'Assigned Active');
      assert.equal(variant, 'active');
    });

    it('resolves upcoming status for subsequent regular masses', () => {
      const { status, variant } = resolveRotationStatus(
        { title: 'Mass 2', choir_name: 'Youth Choir' },
        1
      );
      assert.equal(status, 'Upcoming');
      assert.equal(variant, 'upcoming');
    });

    it('resolves combined status for Grand Fiesta or Combined Choirs regardless of index', () => {
      const res1 = resolveRotationStatus(
        { title: 'Grand Sinulog Festival High Mass', choir_name: 'Combined Choirs' },
        0
      );
      assert.equal(res1.status, 'Combined Choirs');
      assert.equal(res1.variant, 'combined');

      const res2 = resolveRotationStatus(
        { title: 'Regular Mass', choir_name: 'Combined NZ Sinulog Festival Choirs' },
        3
      );
      assert.equal(res2.status, 'Combined Choirs');
      assert.equal(res2.variant, 'combined');
    });
  });
});

// ==========================================
// SUITE: Event Transformation & Resolution
// ==========================================

describe('ChoirRotationModal - Event Transformation', () => {
  it('transforms an EventWithRoster into a ChoirRotationItem correctly', () => {
    const mockEvent = createMockEvent({
      id: 'evt-100',
      venue: "St Patrick's Cathedral",
      event_start_time: '5:30 PM',
      event_start_date: '2026-11-21',
      mass_sequence_number: 2,
      choir_name: 'Auckland Catholic Youth Choir',
      presider_name: 'Rev. Fr. Bernard Espiritu',
      sponsor_chapter: 'Auckland Central',
    });

    const item = transformEventToRotationItem(mockEvent, 1);
    assert.equal(item.id, 'evt-100');
    assert.equal(item.sequenceLabel, 'Mass 2 • Nov 21');
    assert.equal(item.venueDisplay, "St Patrick's Cathedral (5:30 PM)");
    assert.equal(item.choirName, 'Auckland Catholic Youth Choir');
    assert.equal(item.presiderName, 'Rev. Fr. Bernard Espiritu');
    assert.equal(item.sponsorChapter, 'Auckland Central');
    assert.equal(item.status, 'Upcoming');
    assert.equal(item.variant, 'upcoming');
  });

  it('handles fallback fields when choir_group or presider display name is used', () => {
    const mockEvent = createMockEvent({
      choir_name: null,
      choir_group: { id: 'g1', name: 'St Benedict Parish Choir' },
      presider_name: null,
      presider: { id: 'p1', display_name: 'Sherwin Lapaan', avatar_url: null },
      sponsor_chapter: null,
    });

    const item = transformEventToRotationItem(mockEvent, 0);
    assert.equal(item.choirName, 'St Benedict Parish Choir');
    assert.equal(item.presiderName, 'Rev. Fr. Sherwin Lapaan');
    assert.equal(item.sponsorChapter, 'Auckland Devotee Chapter');
  });

  describe('resolveRotationItems', () => {
    it('returns DEFAULT_CHOIR_ROTATION_PRESETS when events is undefined', () => {
      const items = resolveRotationItems(undefined);
      assert.deepEqual(items, DEFAULT_CHOIR_ROTATION_PRESETS);
    });

    it('returns DEFAULT_CHOIR_ROTATION_PRESETS when events is an empty array', () => {
      const items = resolveRotationItems([]);
      assert.deepEqual(items, DEFAULT_CHOIR_ROTATION_PRESETS);
    });

    it('transforms and returns custom items when events are provided', () => {
      const events: EventWithRoster[] = [
        createMockEvent({ id: 'e1', mass_sequence_number: 1, event_start_date: '2026-11-14' }),
        createMockEvent({ id: 'e2', mass_sequence_number: 2, event_start_date: '2026-11-21' }),
      ];

      const items = resolveRotationItems(events);
      assert.equal(items.length, 2);
      assert.equal(items[0].id, 'e1');
      assert.equal(items[0].sequenceLabel, 'Mass 1 • Nov 14');
      assert.equal(items[1].id, 'e2');
      assert.equal(items[1].sequenceLabel, 'Mass 2 • Nov 21');
    });
  });
});

// ==========================================
// SUITE: Action Triggers & Markup
// ==========================================

describe('ChoirRotationModal - Action Handlers & Callback Triggers', () => {
  it('triggers onRegisterChapterChoir when handler is supplied', () => {
    let triggered = false;
    const handled = executeRegisterChoirAction(() => {
      triggered = true;
    });
    assert.equal(handled, true);
    assert.equal(triggered, true);
  });

  it('triggers fallback alert when onRegisterChapterChoir is not provided', () => {
    let alertMessage = '';
    const handled = executeRegisterChoirAction(undefined, (msg) => {
      alertMessage = msg;
    });
    assert.equal(handled, false);
    assert.match(alertMessage, /Music Ministry coordinator to register your chapter choir/i);
  });
});

describe('ChoirRotationModal - Markup & Structure', () => {
  it('returns empty output when isOpen is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(ChoirRotationModal, {
        isOpen: false,
        onClose: () => {},
      })
    );
    assert.equal(html, '');
  });

  it('renders modal dialog with preset liturgical schedule when isOpen is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(ChoirRotationModal, {
        isOpen: true,
        onClose: () => {},
      })
    );

    // Dialog container
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
    assert.match(html, /data-testid="choir-rotation-modal"/);

    // Title and subtitle
    assert.match(html, /Choir &amp; Ministry Rotation Schedule/);
    assert.match(html, /Santo Niño Novena &amp; Simbang Gabi Masses/);

    // Presets rendered
    assert.match(html, /data-testid="choir-rotation-item-preset-mass-1"/);
    assert.match(html, /Mass 1 • Nov 14/);
    assert.match(html, /Coro de Santo Niño \(North Shore\)/);
    assert.match(html, /Rev\. Fr\. Mario Gomez/);
    assert.match(html, /Pukekohe Chapter/);
    assert.match(html, /Assigned Active/);

    assert.match(html, /data-testid="choir-rotation-item-preset-mass-2"/);
    assert.match(html, /Mass 2 • Nov 21/);
    assert.match(html, /Auckland Catholic Youth Choir/);
    assert.match(html, /Upcoming/);

    assert.match(html, /data-testid="choir-rotation-item-preset-mass-3"/);
    assert.match(html, /Mass 3 • Nov 28/);
    assert.match(html, /Voices of Faith \(West Auckland Chapter\)/);

    assert.match(html, /data-testid="choir-rotation-item-preset-grand-fiesta"/);
    assert.match(html, /Grand Fiesta • Jan 18/);
    assert.match(html, /Combined NZ Sinulog Festival Choirs/);
    assert.match(html, /Combined Choirs/);

    // Buttons
    assert.match(html, /data-testid="register-choir-button"/);
    assert.match(html, /\+ Register Chapter Choir/);
    assert.match(html, /data-testid="close-footer-button"/);
    assert.match(html, /data-testid="close-modal-button"/);
  });

  it('renders live event data when events prop is provided', () => {
    const liveEvents: EventWithRoster[] = [
      createMockEvent({
        id: 'live-evt-1',
        title: 'Novena Mass Day 1',
        venue: 'St Mary Church',
        event_start_time: '6:30 PM',
        event_start_date: '2026-12-15',
        choir_name: 'East Auckland Children Choir',
        presider_name: 'Rev. Fr. Peter Pham',
        sponsor_chapter: 'East Auckland Chapter',
        mass_sequence_number: 1,
      }),
    ];

    const html = renderToStaticMarkup(
      React.createElement(ChoirRotationModal, {
        isOpen: true,
        onClose: () => {},
        events: liveEvents,
      })
    );

    assert.match(html, /data-testid="choir-rotation-item-live-evt-1"/);
    assert.match(html, /Mass 1 • Dec 15/);
    assert.match(html, /St Mary Church \(6:30 PM\)/);
    assert.match(html, /East Auckland Children Choir/);
    assert.match(html, /Rev\. Fr\. Peter Pham/);
    assert.match(html, /East Auckland Chapter/);
    assert.match(html, /Assigned Active/);
  });
});
