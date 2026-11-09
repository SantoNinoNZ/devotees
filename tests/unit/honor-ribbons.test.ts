import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ProfileWithRoles, UserBadgeWithDefinition } from '../../src/types';
import {
  HonorRibbonsModal,
  DEFAULT_HONOR_RIBBONS,
  BADGE_COLOR_STYLES,
  getBadgeDefaultIcon,
  resolveBadgeColorScheme,
  transformUserBadgeToItem,
  resolveModalBadges,
  getInitials,
  formatDevoteeLocation,
  type DefaultBadgeItem,
} from '../../src/components/profile/HonorRibbonsModal';

// ==========================================
// TEST FIXTURES
// ==========================================

function createMockProfile(overrides: Partial<ProfileWithRoles> = {}): ProfileWithRoles {
  return {
    id: 'user-test-123',
    display_name: 'Maria Santos',
    email: 'maria.santos@example.com',
    phone: '+64210000000',
    avatar_url: 'https://example.com/avatar.jpg',
    area_id: 'area-wellington',
    is_active: true,
    created_at: '2023-05-15T08:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    area: {
      id: 'area-wellington',
      name: 'Wellington Central',
    },
    roles: [
      {
        role: 'devotee',
        area_id: 'area-wellington',
        dance_group_id: null,
        is_active: true,
      },
    ],
    user_badges: [],
    ...overrides,
  };
}

function createMockUserBadge(overrides: Partial<UserBadgeWithDefinition> = {}): UserBadgeWithDefinition {
  return {
    id: 'ub-1',
    user_id: 'user-test-123',
    badge_id: 'dancer-streak',
    year: 2026,
    title_override: 'Sinulog Festival Lead Dancer',
    organization_or_troupe: 'Sinulog Auckland Dance Troupe',
    metadata: null,
    is_featured: true,
    awarded_by: 'council-1',
    awarded_at: '2026-01-18T10:00:00Z',
    definition: {
      id: 'dancer-streak',
      name: 'Sinulog Dancer',
      category: 'performance',
      icon: '💃',
      description: 'Awarded for active Sinulog performance',
      is_repeatable_yearly: true,
      badge_color: 'amber',
      is_verified_only: true,
      created_at: '2025-01-01T00:00:00Z',
    },
    ...overrides,
  };
}

// ==========================================
// SUITE: Default Presets & Styles
// ==========================================

describe('HonorRibbonsModal - Default Presets', () => {
  it('contains exactly 5 default honor badge presets', () => {
    assert.equal(DEFAULT_HONOR_RIBBONS.length, 5);
  });

  it('verifies Badge 1 (Sinulog Dancer) preset attributes', () => {
    const dancer = DEFAULT_HONOR_RIBBONS[0];
    assert.equal(dancer.id, 'preset-sinulog-dancer');
    assert.equal(dancer.title, 'Sinulog Dancer');
    assert.equal(dancer.subtitle, "'24, '25, '26 (3 yrs)");
    assert.equal(dancer.icon, '💃');
    assert.equal(dancer.colorScheme, 'amber');
    assert.equal(dancer.isVerified, true);
  });

  it('verifies Badge 2 (Photographer) preset attributes', () => {
    const photo = DEFAULT_HONOR_RIBBONS[1];
    assert.equal(photo.id, 'preset-photographer');
    assert.equal(photo.title, 'Photographer');
    assert.equal(photo.subtitle, "Official Media '25");
    assert.equal(photo.icon, '📸');
    assert.equal(photo.colorScheme, 'blue');
    assert.equal(photo.isVerified, true);
  });

  it('verifies Badge 3 (Novena Streak) preset attributes', () => {
    const novena = DEFAULT_HONOR_RIBBONS[2];
    assert.equal(novena.id, 'preset-novena-streak');
    assert.equal(novena.title, 'Novena Streak');
    assert.equal(novena.subtitle, "9 Days Done '26");
    assert.equal(novena.icon, '📿');
    assert.equal(novena.colorScheme, 'emerald');
    assert.equal(novena.isVerified, true);
  });

  it('verifies Badge 4 (Festival Vendor) preset attributes', () => {
    const vendor = DEFAULT_HONOR_RIBBONS[3];
    assert.equal(vendor.id, 'preset-festival-vendor');
    assert.equal(vendor.title, 'Festival Vendor');
    assert.equal(vendor.subtitle, "Food Partner '26 (Kanto Grill NZ)");
    assert.equal(vendor.icon, '🛍️');
    assert.equal(vendor.colorScheme, 'purple');
    assert.equal(vendor.isVerified, true);
  });

  it('verifies Badge 5 (Choir Member) preset attributes and 2-column span', () => {
    const choir = DEFAULT_HONOR_RIBBONS[4];
    assert.equal(choir.id, 'preset-choir-member');
    assert.equal(choir.title, 'Music Ministry Choir Member');
    assert.equal(choir.subtitle, "Coro de Santo Niño ('24, '25, '26 Rotation)");
    assert.equal(choir.icon, '🎶');
    assert.equal(choir.colorScheme, 'rose');
    assert.equal(choir.colSpan, 2);
    assert.equal(choir.isVerified, true);
  });

  it('verifies color styles exist for all color schemes', () => {
    const schemes = ['amber', 'blue', 'emerald', 'purple', 'rose', 'stone'] as const;
    for (const s of schemes) {
      assert.ok(BADGE_COLOR_STYLES[s]);
      assert.ok(BADGE_COLOR_STYLES[s].border);
      assert.ok(BADGE_COLOR_STYLES[s].hoverBorder);
      assert.ok(BADGE_COLOR_STYLES[s].iconBg);
      assert.ok(BADGE_COLOR_STYLES[s].subtitleText);
    }
  });
});

// ==========================================
// SUITE: Helpers & Icon Resolution
// ==========================================

describe('HonorRibbonsModal - Helpers', () => {
  describe('getBadgeDefaultIcon', () => {
    it('returns clergy icon for clergy terms', () => {
      assert.equal(getBadgeDefaultIcon('Spiritual Director Priest', 'clergy'), '✝️');
      assert.equal(getBadgeDefaultIcon('Rev. Priest'), '✝️');
    });

    it('returns crown icon for Hermana or verified', () => {
      assert.equal(getBadgeDefaultIcon('Verified Hermana 2026'), '👑');
    });

    it('returns house icon for pilgrim host', () => {
      assert.equal(getBadgeDefaultIcon('Pilgrim Image Host 2025'), '🏠');
    });

    it('returns dancer icon for dancer badges', () => {
      assert.equal(getBadgeDefaultIcon('Sinulog Dancer 2026', 'dance'), '💃');
    });

    it('returns trophy icon for troupe champions', () => {
      assert.equal(getBadgeDefaultIcon('Sinulog Troupe Champion'), '🏆');
    });

    it('returns camera icon for media', () => {
      assert.equal(getBadgeDefaultIcon('Official Photographer', 'media'), '📸');
    });

    it('returns rosary icon for novena', () => {
      assert.equal(getBadgeDefaultIcon('9-Day Novena Completer', 'liturgy'), '📿');
    });

    it('returns music notes icon for choir', () => {
      assert.equal(getBadgeDefaultIcon('Coro de Santo Niño Member', 'music'), '🎶');
    });

    it('returns shopping bag icon for vendor / food partners', () => {
      assert.equal(getBadgeDefaultIcon('Festival Food Partner', 'partner'), '🛍️');
    });

    it('returns generic medal icon as fallback', () => {
      assert.equal(getBadgeDefaultIcon('General Devotee Award'), '🎖️');
    });
  });

  describe('resolveBadgeColorScheme', () => {
    it('uses explicit colorScheme if valid', () => {
      assert.equal(resolveBadgeColorScheme({ colorScheme: 'blue' }), 'blue');
      assert.equal(resolveBadgeColorScheme({ colorScheme: 'rose' }), 'rose');
    });

    it('uses definition badge_color if defined', () => {
      const badge = {
        definition: { badge_color: 'emerald', category: 'liturgy', name: 'Prayer' },
      };
      assert.equal(resolveBadgeColorScheme(badge), 'emerald');
    });

    it('maps media and photo keywords to blue', () => {
      assert.equal(resolveBadgeColorScheme({ title: 'Lead Photographer' }), 'blue');
      assert.equal(resolveBadgeColorScheme({ category: 'media' }), 'blue');
    });

    it('maps novena and liturgy keywords to emerald', () => {
      assert.equal(resolveBadgeColorScheme({ title: 'Novena Streak' }), 'emerald');
      assert.equal(resolveBadgeColorScheme({ category: 'liturgy' }), 'emerald');
    });

    it('maps vendors and troupe champions to purple', () => {
      assert.equal(resolveBadgeColorScheme({ title: 'Food Vendor Partner' }), 'purple');
      assert.equal(resolveBadgeColorScheme({ title: 'Troupe Champion 2026' }), 'purple');
    });

    it('maps choir and music to rose', () => {
      assert.equal(resolveBadgeColorScheme({ title: 'Coro de Santo Niño' }), 'rose');
      assert.equal(resolveBadgeColorScheme({ category: 'music' }), 'rose');
    });

    it('falls back to amber for clergy / dancer / defaults', () => {
      assert.equal(resolveBadgeColorScheme({ title: 'Sinulog Lead Dancer' }), 'amber');
      assert.equal(resolveBadgeColorScheme({ title: 'Unknown Honor' }), 'amber');
    });
  });

  describe('getInitials', () => {
    it('extracts two letters from first and last names', () => {
      assert.equal(getInitials('Elijah Mondero'), 'EM');
      assert.equal(getInitials('Maria Teresa Santos'), 'MS');
    });

    it('extracts two letters from single word name', () => {
      assert.equal(getInitials('SantoNino'), 'SA');
    });

    it('returns EM fallback for empty or whitespace string', () => {
      assert.equal(getInitials(''), 'EM');
      assert.equal(getInitials('   '), 'EM');
      assert.equal(getInitials(null), 'EM');
      assert.equal(getInitials(undefined), 'EM');
    });
  });

  describe('formatDevoteeLocation', () => {
    it('formats location and joined year from profile', () => {
      const profile = createMockProfile({
        created_at: '2023-11-20T00:00:00Z',
        area: { id: 'a1', name: 'West Auckland' },
      });
      assert.equal(formatDevoteeLocation(profile), '📍 West Auckland Chapter • Joined 2023');
    });

    it('avoids duplicate "Chapter" suffix if already in name', () => {
      const profile = createMockProfile({
        created_at: '2025-01-01T00:00:00Z',
        area: { id: 'a1', name: 'North Shore Chapter' },
      });
      assert.equal(formatDevoteeLocation(profile), '📍 North Shore Chapter • Joined 2025');
    });

    it('returns fallback string when profile is null or undefined', () => {
      assert.equal(formatDevoteeLocation(null), '📍 North Shore Chapter • Joined 2024');
      assert.equal(formatDevoteeLocation(undefined), '📍 North Shore Chapter • Joined 2024');
    });
  });
});

// ==========================================
// SUITE: Dynamic Badge Resolution
// ==========================================

describe('HonorRibbonsModal - Dynamic Badge Resolution', () => {
  it('transforms UserBadgeWithDefinition into DefaultBadgeItem', () => {
    const userBadge = createMockUserBadge();
    const item = transformUserBadgeToItem(userBadge);

    assert.equal(item.id, 'ub-1');
    assert.equal(item.title, 'Sinulog Festival Lead Dancer');
    assert.equal(item.subtitle, "Sinulog Auckland Dance Troupe ('26)");
    assert.equal(item.icon, '💃');
    assert.equal(item.colorScheme, 'amber');
    assert.equal(item.colSpan, 2); // Title > 20 chars
    assert.equal(item.organization, 'Sinulog Auckland Dance Troupe');
    assert.equal(item.year, 2026);
    assert.equal(item.isVerified, true);
    assert.equal(item.rawBadge, userBadge);
  });

  it('handles UserBadge with only year and no organization', () => {
    const userBadge = createMockUserBadge({
      organization_or_troupe: null,
      title_override: 'Sinulog Dancer',
      year: 2025,
    });
    const item = transformUserBadgeToItem(userBadge);
    assert.equal(item.subtitle, "Verified '25");
    assert.equal(item.colSpan, 1);
  });

  it('resolveModalBadges prefers userBadges parameter when provided', () => {
    const customBadge = createMockUserBadge({
      id: 'custom-1',
      title_override: 'Custom Test Badge',
    });
    const result = resolveModalBadges([customBadge], null);
    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'Custom Test Badge');
  });

  it('resolveModalBadges falls back to profile.user_badges when userBadges is omitted', () => {
    const profileBadge = createMockUserBadge({
      id: 'profile-badge-1',
      title_override: 'Profile Badge',
    });
    const profile = createMockProfile({
      user_badges: [profileBadge],
    });
    const result = resolveModalBadges(null, profile);
    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'Profile Badge');
  });

  it('resolveModalBadges falls back to DEFAULT_HONOR_RIBBONS when both are empty', () => {
    const result = resolveModalBadges([], createMockProfile({ user_badges: [] }));
    assert.equal(result.length, 5);
    assert.equal(result[0].title, 'Sinulog Dancer');
  });
});

// ==========================================
// SUITE: DOM Rendering & Markup
// ==========================================

describe('HonorRibbonsModal - DOM Rendering', () => {
  it('renders nothing when isOpen is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(HonorRibbonsModal, {
        isOpen: false,
        onClose: () => {},
      })
    );
    assert.equal(html, '');
  });

  it('renders Discord-style modal structure when isOpen is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(HonorRibbonsModal, {
        isOpen: true,
        onClose: () => {},
      })
    );

    // Modal container & accessibility
    assert.ok(html.includes('role="dialog"'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('aria-labelledby="profile-modal-title"'));
    assert.ok(html.includes('id="profile-modal"'));

    // Header cover banner
    assert.ok(html.includes('Devotee Profile'));
    assert.ok(html.includes('from-brand-800 via-brand-700 to-gold-600'));

    // Default devotee info
    assert.ok(html.includes('Elijah Mondero'));
    assert.ok(html.includes('EM'));
    assert.ok(html.includes('📍 North Shore Chapter • Joined 2024'));
    assert.ok(html.includes('Active Devotee'));

    // Honor ribbons shelf
    assert.ok(html.includes('Honor Ribbons &amp; Roles (5)'));
    assert.ok(html.includes('Verified by Coordinators'));

    // Default badge titles
    assert.ok(html.includes('Sinulog Dancer'));
    assert.ok(html.includes('Photographer'));
    assert.ok(html.includes('Novena Streak'));
    assert.ok(html.includes('Festival Vendor'));
    assert.ok(html.includes('Music Ministry Choir Member'));

    // Metallic border classes
    assert.ok(html.includes('border-amber-200'));
    assert.ok(html.includes('border-blue-200'));
    assert.ok(html.includes('border-emerald-200'));
    assert.ok(html.includes('border-purple-200'));
    assert.ok(html.includes('border-rose-200'));
    assert.ok(html.includes('col-span-2'));

    // Close button
    assert.ok(html.includes('Close'));
  });

  it('renders custom user profile data accurately', () => {
    const profile = createMockProfile({
      display_name: 'Mateo De La Cruz',
      avatar_url: 'https://cdn.example.com/avatar.png',
      created_at: '2022-01-10T00:00:00Z',
      area: { id: 'chc', name: 'Christchurch' },
      is_active: true,
    });

    const html = renderToStaticMarkup(
      React.createElement(HonorRibbonsModal, {
        isOpen: true,
        onClose: () => {},
        userProfile: profile,
      })
    );

    assert.ok(html.includes('Mateo De La Cruz'));
    assert.ok(html.includes('src="https://cdn.example.com/avatar.png"'));
    assert.ok(html.includes('📍 Christchurch Chapter • Joined 2022'));
    assert.ok(html.includes('Active Devotee'));
  });

  it('renders dynamic userBadges when supplied', () => {
    const badges = [
      createMockUserBadge({
        id: 'b-1',
        title_override: 'Sinulog Queen 2026',
        organization_or_troupe: 'Auckland Sinulog Dancers',
        definition: {
          id: 'queen-def',
          name: 'Sinulog Queen',
          category: 'performance',
          icon: '👑',
          description: 'Sinulog Lead Queen',
          is_repeatable_yearly: true,
          badge_color: 'amber',
          is_verified_only: true,
          created_at: '2026-01-01T00:00:00Z',
        },
      }),
      createMockUserBadge({
        id: 'b-2',
        title_override: 'Youth Choir Tenor',
        organization_or_troupe: 'Coro de Santo Niño',
        definition: {
          id: 'choir-def',
          name: 'Choir Member',
          category: 'service',
          icon: '🎶',
          description: 'Music ministry member',
          is_repeatable_yearly: true,
          badge_color: 'rose',
          is_verified_only: true,
          created_at: '2026-01-01T00:00:00Z',
        },
      }),
    ];

    const html = renderToStaticMarkup(
      React.createElement(HonorRibbonsModal, {
        isOpen: true,
        onClose: () => {},
        userBadges: badges,
      })
    );

    assert.ok(html.includes('Honor Ribbons &amp; Roles (2)'));
    assert.ok(html.includes('Sinulog Queen 2026'));
    assert.ok(html.includes('Youth Choir Tenor'));
    assert.ok(!html.includes('Photographer')); // Default photographer should not be present
  });

  it('renders inactive devotee status if profile is_active is false', () => {
    const profile = createMockProfile({
      is_active: false,
    });

    const html = renderToStaticMarkup(
      React.createElement(HonorRibbonsModal, {
        isOpen: true,
        onClose: () => {},
        userProfile: profile,
      })
    );

    assert.ok(html.includes('Devotee'));
    assert.ok(!html.includes('Active Devotee'));
  });
});
