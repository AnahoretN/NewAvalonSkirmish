import type { CardDefinition } from './cards.js';

const CLOUDINARY_PLACEHOLDER_URL = 'https://res.cloudinary.com/dxxh6meej/image/upload/v1763251487/samples/cloudinary-icon.png';

export const tokenDatabase = new Map<string, CardDefinition>([
    ['reconDrone', { name: 'Recon Drone',
	imageUrl: 'https://res.cloudinary.com/dxxh6meej/image/upload/v1763253333/TKN_RECON_DRONE_esfknf.png',
	fallbackImage: '/images/cards/TKN_RECON_DRONE.png',
	power: 1, ability: 'P: When a command is played, you may move this card to any free cell.', color: 'bg-gray-400' }],
    ['walkingTurret', { name: 'Walking Turret',
	imageUrl: 'https://res.cloudinary.com/dxxh6meej/image/upload/v1763253307/TKN_WALKING_TURRET_uq6owm.png',
	fallbackImage: '/images/cards/TKN_WALKING_TURRET.png',
	power: 2, ability: 'Discard 2 ⇒ Shield 1.', color: 'bg-red-300' }],
]);