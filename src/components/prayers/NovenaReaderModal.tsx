'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { novenaProgressApi } from '@/lib/supabase-api';

// ==========================================
// INTERFACES & TYPES
// ==========================================

export interface NovenaSupplication {
  text: string;
  response?: string;
}

export interface NovenaDayData {
  day: number;
  title: string;
  theme: string;
  openingPrayer: string;
  reflection: string;
  supplications: NovenaSupplication[];
  closingPrayer: string;
}

export interface NovenaReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDay?: number; // default 3
  cycleYear?: number; // default 2026
  onDayCompleted?: (day: number) => void;
  onShareBadge?: (day: number) => void;
  initialCompletedDays?: number[];
  audioSrc?: string;
}

// Default stream endpoint hosted via static storage (0 Supabase egress cost)
export const DEFAULT_AUDIO_HYMN_URL =
  'https://santoninonz.github.io/audio/bato-balani-sa-gugma.mp3';

// ==========================================
// 9-DAY SACRED NOVENA DATASET
// ==========================================

export const NOVENA_DAYS_DATA: NovenaDayData[] = [
  {
    day: 1,
    title: 'Day 1 of 9: Petitions for Faith & Spiritual Renewal',
    theme: 'Spiritual Renewal and Strong Faith',
    openingPrayer:
      'O Señor Santo Niño, you were sent by the Heavenly Father as a gentle light to lead all souls to eternal truth. Grant us the grace of true conversion and an unwavering faith, that we may walk humbly and steadfastly in your divine presence throughout our pilgrimage on earth.',
    reflection:
      'True devotion begins with childlike surrender to God’s holy will. As we embark on this nine-day novena journey, let us unclutter our hearts, asking Señor Santo Niño to illuminate our paths with heavenly grace and renewed fervor.',
    supplications: [
      {
        text: 'For a deepening of personal faith and frequent reception of the Holy Sacraments:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For brothers and sisters who have drifted from the Church and seek the way home:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For our Kiwi-Filipino parish communities across Aotearoa New Zealand:',
        response: 'Hear us, O Holy Child Jesus.',
      },
    ],
    closingPrayer:
      'Almighty Child Jesus, protector of pilgrims, anchor our hearts in your gospel and keep our faith pure through every trial of life. Amen.',
  },
  {
    day: 2,
    title: 'Day 2 of 9: Petitions for Peace, Love, & Reconciliation',
    theme: 'Peace, Love, and Harmony',
    openingPrayer:
      'O Prince of Peace, Señor Santo Niño, you bring reconciliation to estranged hearts and divine consolation to troubled minds. Look kindly upon our homes, neighborhoods, and churches, filling every corner with your heavenly serenity.',
    reflection:
      'Christ invites us to become instruments of his peaceful love. In times of discord or misunderstanding, let us be the first to extend forgiveness, mirroring the tender mercy of the Holy Infant.',
    supplications: [
      {
        text: 'For families wounded by division, past hurt, or geographical separation:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For peace among nations and safety across our cities and towns in New Zealand:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For gentleness in our speech and a forgiving spirit in our daily interactions:',
        response: 'Hear us, O Holy Child Jesus.',
      },
    ],
    closingPrayer:
      'O Holy Infant Jesus, ruler of our hearts, banish bitterness from our midst and let your divine peace reign in our lives. Amen.',
  },
  {
    day: 3,
    title: 'Day 3 of 9: Petitions for Families',
    theme: 'Blessings for Families and Migrant Workers',
    openingPrayer:
      'O Señor Santo Niño, who in your boundless love became a humble child for our salvation, look with tenderness upon the families of our community in New Zealand and across our beloved homeland. Bless our parents, protect our children, and grant health to our loved ones.',
    reflection:
      'The Holy Family of Nazareth is the model for all domestic churches. May our households in Aotearoa reflect the warmth, mutual respect, prayerfulness, and holiness that radiated from the home of Jesus, Mary, and Joseph.',
    supplications: [
      {
        text: 'For our overseas workers and immigrants navigating life in NZ:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For the sick, elderly, and those awaiting surgery:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For peace and purity in all Christian households:',
        response: 'Hear us, O Holy Child Jesus.',
      },
    ],
    closingPrayer:
      'Señor Santo Niño, guardian of our families, bless our homes with your divine love, harmony, and lasting protection. Amen.',
  },
  {
    day: 4,
    title: 'Day 4 of 9: Petitions for the Sick & Suffering',
    theme: 'Divine Healing and Solace for the Afflicted',
    openingPrayer:
      'O Divine Physician, Señor Santo Niño, you walked the earth healing the infirm and restoring hope to the downtrodden. We place before your miraculous presence all our brothers and sisters enduring pain of body, anguish of soul, or burden of mind.',
    reflection:
      'In our vulnerability and physical fragility, Christ draws nearest to us. We surrender our fears and illnesses into his compassionate hands, confident in his healing power and loving providence.',
    supplications: [
      {
        text: 'For those battling cancer, chronic illness, and severe pain in our parishes:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For doctors, nurses, carers, and hospital chaplains across New Zealand:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For those carrying silent mental anguish, anxiety, or deep bereavement:',
        response: 'Hear us, O Holy Child Jesus.',
      },
    ],
    closingPrayer:
      'O Merciful Child Jesus, breathe health into the weak and grant unwavering fortitude to all who carry the cross. Amen.',
  },
  {
    day: 5,
    title: 'Day 5 of 9: Petitions for Children & Catholic Youth',
    theme: 'Guidance for Children and Future Generations',
    openingPrayer:
      'O Señor Santo Niño, you embraced the little children and proclaimed that the Kingdom of Heaven belongs to those who resemble them. Shield our children and youth from moral dangers and lead them in wisdom and virtue.',
    reflection:
      'Our young people are the living heart of our faith community. By cherishing the innocence and joyful wonder of the Santo Niño, we guide our sons and daughters toward lives of purpose, generosity, and authentic discipleship.',
    supplications: [
      {
        text: 'For the spiritual protection and moral integrity of our young people:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For students striving in their studies, sports, and artistic endeavors:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For children who are abandoned, neglected, or suffering from poverty worldwide:',
        response: 'Hear us, O Holy Child Jesus.',
      },
    ],
    closingPrayer:
      'Holy Child Jesus, champion of little ones, clasp our youth closely to your sacred heart and inspire them to lead with faith. Amen.',
  },
  {
    day: 6,
    title: 'Day 6 of 9: Petitions for Priests & Ministry Leaders',
    theme: 'Vocations to Priesthood, Religious Life, and Ministry',
    openingPrayer:
      'O Eternal High Priest, Señor Santo Niño, you send laborers into the vineyard to feed your flock. We pray for our Holy Father, bishops, priests, deacons, religious sisters, brothers, and dedicated lay ministry leaders.',
    reflection:
      'Without faithful shepherds and dedicated servants, our spiritual journey falters. Let us uplift those who offer their lives at the altar and in church ministry, praying for their holiness, courage, and perseverance.',
    supplications: [
      {
        text: 'For the holiness and pastoral zeal of our parish priests and chaplains:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For Hermanas, Hermanos, choir members, and coordinators organizing our festivals:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For generous vocations to the priesthood and religious life from our kiwi diaspora:',
        response: 'Hear us, O Holy Child Jesus.',
      },
    ],
    closingPrayer:
      'Señor Santo Niño, divine shepherd, sanctify our clergy and ignite the hearts of our ministry volunteers with apostolate zeal. Amen.',
  },
  {
    day: 7,
    title: 'Day 7 of 9: Petitions for Charity & the Needy',
    theme: 'Humility, Charity, and Generosity towards the Poor',
    openingPrayer:
      'O Señor Santo Niño, born in the poverty of a humble manger, you taught humanity that heavenly treasures surpass earthly wealth. Impart to us a spirit of true humility and open our hearts to serve the poor.',
    reflection:
      'Every act of mercy offered to the least of our brethren is offered directly to the Christ Child. Devotion to the Santo Niño bears authentic fruit when manifested in practical generosity, hospitality, and solidarity.',
    supplications: [
      {
        text: 'For the homeless, the unemployed, and families struggling with the cost of living:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For generous support toward charitable outreach and typhoon relief in our homeland:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For hearts detached from worldly greed, vanity, and pride:',
        response: 'Hear us, O Holy Child Jesus.',
      },
    ],
    closingPrayer:
      'Humble Infant Jesus, make our hearts resemble yours in compassionate tenderness and self-giving charity. Amen.',
  },
  {
    day: 8,
    title: 'Day 8 of 9: Petitions of Thanksgiving',
    theme: 'Gratitude for God’s Countless Blessings & Miracles',
    openingPrayer:
      'O Bountiful Provider, Señor Santo Niño, with overflowing gratitude we praise you for the countless graces, answered petitions, and silent miracles you shower upon our community year after year.',
    reflection:
      'A grateful heart is a magnet for continued blessing. Let us reflect upon the answered prayers of our migration journey, the gift of our heritage, and the loving hand of God that carries us through every season.',
    supplications: [
      {
        text: 'In joyful thanksgiving for the gifts of life, faith, and Christian brotherhood:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'In gratitude for work visas approved, residences secured, and safe journeys:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'In praise of the Santo Niño’s constant protection over the Kiwi-Filipino community:',
        response: 'Hear us, O Holy Child Jesus.',
      },
    ],
    closingPrayer:
      'All glory, thanksgiving, and adoration belong to you, Señor Santo Niño, our King and Supreme Benefactor! Amen.',
  },
  {
    day: 9,
    title: 'Day 9 of 9: Community Unity & Viva Pit Señor!',
    theme: 'Perseverance, Sinulog Festival, and Eternal Glory',
    openingPrayer:
      'O Señor Santo Niño, King of Kings and Lord of Lords, as we conclude this nine-day novena, we raise our voices in jubilant praise. Crown our prayers with the crown of perseverance and eternal communion with you in heaven.',
    reflection:
      'Viva Pit Señor! Our devotional novena culminates in festive praise, colorful dance, and profound gratitude. May the flame of devotion ignited during these nine days burn brightly throughout the entire year ahead.',
    supplications: [
      {
        text: 'For all chapters, dancers, choirs, and devotees celebrating the Grand Sinulog Festival:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For the eternal repose of the deceased members and founders of our Santo Niño devotion:',
        response: 'Hear us, O Holy Child Jesus.',
      },
      {
        text: 'For steadfast perseverance in our Catholic faith until we behold your face in glory:',
        response: 'Hear us, O Holy Child Jesus.',
      },
    ],
    closingPrayer:
      'Señor Santo Niño, protect Aotearoa New Zealand and the Philippines! Viva Pit Señor! Viva Señor Santo Niño! Amen.',
  },
];

// ==========================================
// PURE RESOLVERS & HELPER FUNCTIONS
// ==========================================

/**
 * Returns prayer dataset for a specific day (clamped between 1 and 9).
 */
export function getNovenaDayData(dayNumber: number): NovenaDayData {
  const safeDay = Math.max(1, Math.min(9, Math.floor(dayNumber || 1)));
  return (
    NOVENA_DAYS_DATA.find((item) => item.day === safeDay) || NOVENA_DAYS_DATA[0]
  );
}

/**
 * Formats a ready-to-share community status badge string for the given day.
 */
export function formatNovenaShareText(
  dayNumber: number,
  theme?: string
): string {
  const safeDay = Math.max(1, Math.min(9, Math.floor(dayNumber || 1)));
  const themeSuffix = theme ? ` (${theme})` : '';
  return `Just completed Day ${safeDay} of the Novena to Señor Santo Niño!${themeSuffix} Viva Pit Señor! 📿`;
}

/**
 * Computes novena streak statistics and completion percentage.
 */
export function calculateNovenaStreak(completedDays: number[]): {
  completedCount: number;
  isFullNovenaCompleted: boolean;
  percentage: number;
} {
  const uniqueDays = new Set(
    completedDays.filter((d) => typeof d === 'number' && d >= 1 && d <= 9)
  );
  const count = uniqueDays.size;
  return {
    completedCount: count,
    isFullNovenaCompleted: count === 9,
    percentage: Math.round((count / 9) * 100),
  };
}

// ==========================================
// COMPONENT
// ==========================================

export function NovenaReaderModal({
  isOpen,
  onClose,
  initialDay = 3,
  cycleYear = 2026,
  onDayCompleted,
  onShareBadge,
  initialCompletedDays = [],
  audioSrc = DEFAULT_AUDIO_HYMN_URL,
}: NovenaReaderModalProps) {
  const { user } = useAuth();

  const [currentDay, setCurrentDay] = useState<number>(() => {
    return Math.max(1, Math.min(9, initialDay || 3));
  });

  const [completedDays, setCompletedDays] = useState<number[]>(() => [
    ...initialCompletedDays,
  ]);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync initialDay when modal opens or initialDay prop changes
  useEffect(() => {
    if (initialDay && initialDay >= 1 && initialDay <= 9) {
      setCurrentDay(initialDay);
    }
  }, [initialDay, isOpen]);

  // Load progress from Supabase if authenticated user is active
  useEffect(() => {
    let isMounted = true;
    if (isOpen && user?.id) {
      novenaProgressApi
        .getUserNovenaProgress(user.id, cycleYear)
        .then((records) => {
          if (!isMounted || !records || !Array.isArray(records)) return;
          const remoteCompleted = records.map((r) => r.day_number);
          setCompletedDays((prev) =>
            Array.from(new Set([...prev, ...remoteCompleted]))
          );
        })
        .catch((err) => {
          console.warn('Could not fetch user novena progress:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, user?.id, cycleYear]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Pause audio when modal is closed
  useEffect(() => {
    if (!isOpen && audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen, isPlaying]);

  // Clear notice after 4 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Audio play/pause toggle
  const toggleAudioHymn = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      // In SSR or testing environments without audioRef implementation
      setIsPlaying((prev) => !prev);
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Audio play prevented or unavailable:', err);
            // Toggle playing state so UI reflects devotee intent
            setIsPlaying((prev) => !prev);
          });
      } else {
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  // Mark current day completed
  const handleMarkDayCompleted = async () => {
    setIsSubmitting(true);
    try {
      if (user?.id) {
        await novenaProgressApi.markDayCompleted(
          user.id,
          currentDay,
          cycleYear
        );
      }

      setCompletedDays((prev) =>
        prev.includes(currentDay) ? prev : [...prev, currentDay]
      );
      setNotification(
        `Day ${currentDay} completed! Your streak has been saved to novena_progress (Cycle ${cycleYear}).`
      );
      onDayCompleted?.(currentDay);
    } catch (err) {
      console.warn('Supabase markDayCompleted failed, completing locally:', err);
      setCompletedDays((prev) =>
        prev.includes(currentDay) ? prev : [...prev, currentDay]
      );
      setNotification(
        `Day ${currentDay} marked complete locally for Cycle ${cycleYear}.`
      );
      onDayCompleted?.(currentDay);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Share streak badge
  const handleShareStreak = () => {
    const shareText = formatNovenaShareText(currentDay);
    if (onShareBadge) {
      onShareBadge(currentDay);
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }
    setNotification(
      `Shared streak badge: "Just completed Day ${currentDay} of the Novena to Señor Santo Niño! Viva Pit Señor! 📿"`
    );
  };

  if (!isOpen) return null;

  const activeDayData = getNovenaDayData(currentDay);
  const isCurrentDayCompleted = completedDays.includes(currentDay);
  const streakStats = calculateNovenaStreak(completedDays);

  return (
    <div
      id="novena-modal"
      data-testid="novena-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="novena-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        data-testid="novena-modal-container"
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto"
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl" aria-hidden="true">
              📿
            </span>
            <div>
              <h3
                id="novena-modal-title"
                data-testid="novena-modal-title"
                className="font-bold text-brand-900 text-base font-cinzel"
              >
                Novena to Señor Santo Niño
              </h3>
              <div
                data-testid="novena-day-subtitle"
                className="text-[11px] font-bold text-gold-600 uppercase tracking-widest"
              >
                {activeDayData.title}
              </div>
            </div>
          </div>
          <button
            type="button"
            data-testid="close-novena-button"
            onClick={onClose}
            aria-label="Close Novena Reader"
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* ================= 9-DAY PROGRESS & SELECTOR ================= */}
        <div className="space-y-1.5" role="region" aria-label="Novena 9-Day Selector">
          <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
            <span>
              Novena Progress:{' '}
              <strong className="text-emerald-700 font-bold">
                {streakStats.completedCount}/9 Days
              </strong>{' '}
              ({streakStats.percentage}%)
            </span>
            <span className="text-[11px] font-bold font-cinzel text-brand-800">
              Annual Cycle {cycleYear}
            </span>
          </div>

          <div
            className="grid grid-cols-9 gap-1 sm:gap-1.5"
            role="tablist"
            aria-label="Novena Days"
          >
            {NOVENA_DAYS_DATA.map((item) => {
              const isSelected = item.day === currentDay;
              const isDone = completedDays.includes(item.day);
              return (
                <button
                  key={item.day}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`Day ${item.day}${isDone ? ' (Completed)' : ''}`}
                  data-testid={`novena-day-btn-${item.day}`}
                  onClick={() => setCurrentDay(item.day)}
                  className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition ${
                    isSelected
                      ? 'bg-brand-800 text-white shadow-md ring-2 ring-gold-400'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-tighter opacity-75">
                    Day
                  </span>
                  <span className="text-sm font-black">{item.day}</span>
                  {isDone && (
                    <span
                      data-testid={`day-${item.day}-checkmark`}
                      className="text-[9px] text-emerald-700 font-black absolute -top-1 -right-1 bg-white rounded-full w-3.5 h-3.5 flex items-center justify-center shadow border border-emerald-300"
                      title="Completed"
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= LITURGICAL AUDIO HYMN PLAYER ================= */}
        {/* Sacred Audio Hymn Player: Bato Balani sa Gugma */}
        <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              data-testid="audio-play-btn"
              onClick={toggleAudioHymn}
              aria-label={
                isPlaying
                  ? 'Pause Bato Balani sa Gugma'
                  : 'Play Bato Balani sa Gugma'
              }
              className={`w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-bold shadow transition cursor-pointer ${
                isPlaying
                  ? 'bg-brand-800 hover:bg-brand-900 ring-2 ring-amber-400'
                  : 'bg-gold-600 hover:bg-gold-700'
              }`}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div>
              <div className="font-bold text-xs text-amber-950 font-cinzel">
                Bato Balani sa Gugma (Liturgical Hymn)
              </div>
              <div
                id="audio-status-text"
                data-testid="audio-status-text"
                className="text-[11px] text-amber-800"
              >
                {isPlaying
                  ? 'Playing: "Bato Balani sa Gugma" (Chant & Liturgical Choir)'
                  : 'Served via GitHub Pages audio streaming (0 Supabase cost)'}
              </div>
            </div>
          </div>
          <button
            type="button"
            data-testid="audio-listen-badge"
            onClick={toggleAudioHymn}
            className="text-[11px] text-amber-900 font-bold bg-amber-200/60 hover:bg-amber-200 px-2.5 py-1 rounded-full cursor-pointer transition border border-amber-300/40"
          >
            {isPlaying ? 'Pause' : 'Listen'}
          </button>
        </div>

        {/* Hidden Audio Tag */}
        <audio
          ref={audioRef}
          data-testid="novena-audio-element"
          src={audioSrc}
          preload="none"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

        {/* Liturgical Hymn Chorus Refrain */}
        <div
          data-testid="hymn-lyrics-refrain"
          className="px-3.5 py-2 bg-[#FAF8F5] rounded-xl text-[11px] text-stone-700 border border-stone-200 flex items-center space-x-2"
        >
          <span className="font-bold text-brand-800 font-cinzel text-xs">
            Hymn Refrain:
          </span>
          <span className="italic text-stone-800">
            &ldquo;Bato Balani sa gugma, sa daang tawong lumingi, kanamo malooy
            Ka unta, nga Manluluwas namo.&rdquo;
          </span>
        </div>

        {/* Notification Alert Message */}
        {notification && (
          <div
            data-testid="novena-notification-alert"
            className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center justify-between animate-in fade-in"
          >
            <div className="flex items-center space-x-2">
              <span className="font-bold">✓</span>
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-700 font-bold hover:text-emerald-900 px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================= SACRED PRAYER CONTENT ================= */}
        {/* Sacred Prayer Content with Cinzel Headlines */}
        <div className="space-y-3.5 text-sm text-stone-700 leading-relaxed font-normal">
          <div>
            <h4 className="font-bold text-stone-900 font-cinzel text-xs uppercase tracking-wider text-brand-800 mb-1">
              Opening Prayer
            </h4>
            <p
              data-testid="opening-prayer-text"
              className="italic bg-[#FAF8F5] p-3.5 rounded-xl border-l-4 border-brand-800 text-stone-800 text-xs sm:text-sm"
            >
              &ldquo;{activeDayData.openingPrayer}&rdquo;
            </p>
          </div>

          <div>
            <h4
              data-testid="supplications-heading"
              className="font-bold text-stone-900 font-cinzel text-xs uppercase tracking-wider text-brand-800 mb-1.5"
            >
              Supplications for Day {activeDayData.day}:
            </h4>
            <div
              data-testid="supplications-list"
              className="space-y-1.5 text-xs sm:text-sm"
            >
              {activeDayData.supplications.map((petition, idx) => (
                <p key={idx} data-testid={`supplication-item-${idx}`}>
                  • {petition.text}{' '}
                  <em className="font-semibold text-brand-800">
                    {petition.response || 'Hear us, O Holy Child Jesus.'}
                  </em>
                </p>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 font-cinzel text-xs uppercase tracking-wider text-brand-800 mb-1">
              Daily Meditation & Reflection
            </h4>
            <p
              data-testid="reflection-text"
              className="text-xs sm:text-sm text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200/70"
            >
              {activeDayData.reflection}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-stone-900 font-cinzel text-xs uppercase tracking-wider text-brand-800 mb-1">
              Closing Prayer
            </h4>
            <p
              data-testid="closing-prayer-text"
              className="italic text-xs sm:text-sm text-stone-700 bg-[#FAF8F5] p-3 rounded-xl border-l-2 border-gold-600"
            >
              &ldquo;{activeDayData.closingPrayer}&rdquo;
            </p>
          </div>
        </div>

        {/* ================= MODAL BOTTOM ACTIONS ================= */}
        <div className="pt-3.5 border-t border-stone-100 flex flex-col sm:flex-row gap-2.5 justify-between items-center">
          <button
            type="button"
            data-testid="mark-day-complete-btn"
            disabled={isSubmitting}
            onClick={handleMarkDayCompleted}
            className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition shadow disabled:opacity-50 cursor-pointer"
          >
            <i className="fa-solid fa-check" aria-hidden="true"></i>
            <span>
              {isSubmitting
                ? 'Saving...'
                : isCurrentDayCompleted
                ? `Day ${activeDayData.day} Completed ✓`
                : `Mark Day ${activeDayData.day} as Completed`}
            </span>
          </button>

          <button
            type="button"
            data-testid="share-novena-streak-btn"
            onClick={handleShareStreak}
            className="w-full sm:w-auto bg-[#F5F2EC] hover:bg-[#EFEAE2] text-stone-700 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <i
              className="fa-solid fa-share-nodes text-brand-700"
              aria-hidden="true"
            ></i>
            <span>Share Streak Badge</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NovenaReaderModal;
