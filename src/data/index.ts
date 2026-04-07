import { Card } from '../types';
import { heroes } from './heroes';
import { men } from './men';
import { women } from './women';
import { places } from './places';
import { miracles } from './miracles';
import { promises } from './promises';
import { events } from './events';
import { objects } from './objects';

export const cardDatabase: Card[] = [
  ...heroes,
  ...men,
  ...women,
  ...places,
  ...miracles,
  ...promises,
  ...events,
  ...objects
];
