import type { Puzzle } from '../types'

const CRUISE_PHOTOS = [
  { id: 'cruise-pool', label: 'Swimming Pool', emoji: '🏊' },
  { id: 'cruise-anchor', label: 'Anchor', emoji: '⚓' },
  { id: 'cruise-lifeboat', label: 'Lifeboat', emoji: '🚢' },
  { id: 'cruise-sunset', label: 'Ocean Sunset', emoji: '🌅' },
  { id: 'cruise-buffet', label: 'Buffet', emoji: '🍽️' },
  { id: 'cruise-captain', label: 'Captain', emoji: '👨‍✈️' },
  { id: 'cruise-dolphin', label: 'Dolphin', emoji: '🐬' },
  { id: 'cruise-lighthouse', label: 'Lighthouse', emoji: '🏠' },
  { id: 'cruise-telescope', label: 'Telescope', emoji: '🔭' },
]

function generatePlaceholderSvg(emoji: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="#e8e0f0" rx="16"/>
    <text x="150" y="130" text-anchor="middle" font-size="80">${emoji}</text>
    <text x="150" y="200" text-anchor="middle" font-size="20" fill="#5a4d82" font-family="system-ui">${label}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const defaultPuzzle: Puzzle = {
  id: 'cruise-ship-adventure',
  name: 'Cruise Ship Adventure',
  cells: [
    {
      id: 'cell-0',
      clue: 'Splash! Where do you cool off on a hot day at sea?',
      hint: 'People swim and play in it — look for the water!',
      funFact: 'Cruise ship pools use special filters to keep the water clean while the ship sails.',
      correctPhotoId: 'cruise-pool',
    },
    {
      id: 'cell-1',
      clue: 'This heavy metal thing keeps the ship from floating away!',
      hint: "It's big, heavy, and drops into the ocean — clank!",
      funFact: 'Anchors dig into the sea floor so wind and waves do not push a ship around.',
      correctPhotoId: 'cruise-anchor',
    },
    {
      id: 'cell-2',
      clue: 'If everyone needs to leave the ship, they climb into these!',
      hint: "It's a small boat that hangs on the side of the big ship.",
      funFact: 'Cruise ships carry enough lifeboat space for everyone on board.',
      correctPhotoId: 'cruise-lifeboat',
    },
    {
      id: 'cell-3',
      clue: 'The sky turns orange and pink when the day says goodbye!',
      hint: 'Look toward the horizon where the sun meets the water.',
      funFact: 'Sunsets look extra colorful when tiny particles in the air scatter sunlight.',
      correctPhotoId: 'cruise-sunset',
    },
    {
      id: 'cell-4',
      clue: 'All-you-can-eat! A table full of yummy food!',
      hint: 'Plates, trays, and lots of delicious dishes to choose from.',
      funFact: 'A big cruise ship kitchen is called a galley and can make thousands of meals a day.',
      correctPhotoId: 'cruise-buffet',
    },
    {
      id: 'cell-5',
      clue: 'This person wears a fancy uniform and drives the whole ship!',
      hint: 'They give the orders on the bridge — aye aye!',
      funFact: 'The captain works with a whole bridge team to steer and safely navigate the ship.',
      correctPhotoId: 'cruise-captain',
    },
    {
      id: 'cell-6',
      clue: 'A friendly sea creature that loves to jump and play beside the ship!',
      hint: 'They make clicking sounds and are super smart swimmers.',
      funFact: 'Dolphins use clicking sounds like echoes to find food and understand what is nearby.',
      correctPhotoId: 'cruise-dolphin',
    },
    {
      id: 'cell-7',
      clue: 'A tall tower on the shore with a bright light to guide ships!',
      hint: 'Its light shines at night so ships know where the rocks are.',
      funFact: 'Every lighthouse flashes in its own pattern so sailors can tell which light they see.',
      correctPhotoId: 'cruise-lighthouse',
    },
    {
      id: 'cell-8',
      clue: 'Look through this to see faraway islands and stars!',
      hint: 'It makes things that are really far away look really close.',
      funFact: 'A telescope gathers light with lenses or mirrors so faraway things look bigger.',
      correctPhotoId: 'cruise-telescope',
    },
  ],
  photos: CRUISE_PHOTOS.map((p) => ({
    id: p.id,
    url: generatePlaceholderSvg(p.emoji, p.label),
    pathname: '',
    label: p.label,
  })),
  createdAt: new Date().toISOString(),
}
