// TimeBlock — per-era environment + mood configuration
'use strict';
window.TB = window.TB || {};

// Each era gets its own time of day, air quality and light character so the
// jump between periods reads instantly even before you look at a building.
TB.ERA_ENV = {
  1945: {
    title: '1945', tagline: 'Smoke & Victory',
    skyTop: 0xb8a06a, skyBottom: 0xe8d3a0, horizon: 0xd8b878,
    fogColor: 0xd6bd8a, fogDensity: 0.0058,
    sunPos: [-60, 38, 40], sunColor: 0xffdfa0, sunIntensity: 1.5,
    hemiSky: 0xcbb98a, hemiGround: 0x6b5f47, hemiIntensity: 0.55,
    streetlights: false, windowsLit: 0.06, neon: 0.0,
    exposure: 1.0,
    caption: 'The war is ending. Brick, soot, victory bonds and trolley bells.'
  },
  1965: {
    title: '1965', tagline: 'Chrome & Optimism',
    skyTop: 0x2f7fd4, skyBottom: 0xbfe3f5, horizon: 0x9fd2ef,
    fogColor: 0xcfe6f2, fogDensity: 0.0034,
    sunPos: [30, 75, 25], sunColor: 0xfff4d6, sunIntensity: 1.9,
    hemiSky: 0xa8cfee, hemiGround: 0x8a8070, hemiIntensity: 0.7,
    streetlights: false, windowsLit: 0.05, neon: 0.35,
    exposure: 1.05,
    caption: 'High noon in the atomic age. Tailfins, formica and space-race optimism.'
  },
  1985: {
    title: '1985', tagline: 'Neon & Static',
    skyTop: 0x1d1440, skyBottom: 0xd96a3c, horizon: 0x8f3a6e,
    fogColor: 0x46284e, fogDensity: 0.0052,
    sunPos: [-75, 10, -20], sunColor: 0xff7a3c, sunIntensity: 0.9,
    hemiSky: 0x5a3d78, hemiGround: 0x241a2e, hemiIntensity: 0.5,
    streetlights: true, windowsLit: 0.55, neon: 1.0,
    exposure: 1.08,
    caption: 'Dusk on cassette. Neon buzz, boomboxes and a grainy VHS sky.'
  },
  2005: {
    title: '2005', tagline: 'Glass & Ringtones',
    skyTop: 0x5d87b8, skyBottom: 0xc9d4dd, horizon: 0xb4c4d2,
    fogColor: 0xc2ccd6, fogDensity: 0.0040,
    sunPos: [40, 60, -30], sunColor: 0xf2f2ec, sunIntensity: 1.35,
    hemiSky: 0xaebfd0, hemiGround: 0x77787a, hemiIntensity: 0.62,
    streetlights: false, windowsLit: 0.12, neon: 0.25,
    exposure: 1.0,
    caption: 'A slightly overcast Tuesday. Flip phones, frosted glass and frappuccinos.'
  },
  2025: {
    title: '2025', tagline: 'Screens & Greens',
    skyTop: 0x2e77c9, skyBottom: 0xd8ecf7, horizon: 0xbfe0f2,
    fogColor: 0xd5e8f2, fogDensity: 0.0028,
    sunPos: [-25, 70, 45], sunColor: 0xfffbe8, sunIntensity: 1.8,
    hemiSky: 0xb5d8ef, hemiGround: 0x8b9282, hemiIntensity: 0.72,
    streetlights: false, windowsLit: 0.10, neon: 0.3,
    exposure: 1.04,
    caption: 'Crisp morning air. EV chargers, bike lanes and everyone looking at a phone.'
  },
  2055: {
    title: '2055', tagline: 'Holograms & Hum',
    skyTop: 0x060a24, skyBottom: 0x14355c, horizon: 0x1b4a72,
    fogColor: 0x0d2038, fogDensity: 0.0055,
    sunPos: [0, 30, -80], sunColor: 0x7fb8ff, sunIntensity: 0.55,
    hemiSky: 0x2a4a7a, hemiGround: 0x0a1220, hemiIntensity: 0.6,
    streetlights: true, windowsLit: 0.7, neon: 1.0,
    exposure: 1.12,
    caption: 'Blue hour, thirty years out. Hover lanes, holo-ads and a city that glows back.'
  }
};

// Ambience mix per era (consumed by audio.js) — values are gains 0..1
TB.ERA_AUDIO = {
  1945: { rumble: 0.5, traffic: 0.35, crowd: 0.45, birds: 0.25, neonBuzz: 0, hover: 0, honkStyle: 'oldtimey', honkRate: 0.10, bells: 0.5 },
  1965: { rumble: 0.4, traffic: 0.55, crowd: 0.5, birds: 0.35, neonBuzz: 0, hover: 0, honkStyle: 'classic', honkRate: 0.08, bells: 0 },
  1985: { rumble: 0.55, traffic: 0.6, crowd: 0.4, birds: 0, neonBuzz: 0.5, hover: 0, honkStyle: 'classic', honkRate: 0.12, bells: 0 },
  2005: { rumble: 0.5, traffic: 0.65, crowd: 0.5, birds: 0.15, neonBuzz: 0, hover: 0, honkStyle: 'modern', honkRate: 0.07, bells: 0, ringtone: 0.35 },
  2025: { rumble: 0.35, traffic: 0.4, crowd: 0.45, birds: 0.4, neonBuzz: 0, hover: 0.12, honkStyle: 'modern', honkRate: 0.03, bells: 0 },
  2055: { rumble: 0.3, traffic: 0.15, crowd: 0.3, birds: 0, neonBuzz: 0.3, hover: 0.6, honkStyle: 'future', honkRate: 0.03, bells: 0 }
};
