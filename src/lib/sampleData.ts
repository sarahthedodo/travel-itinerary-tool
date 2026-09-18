/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from '../types';
import { generateUUID } from './uuid';

/**
 * Creates a clean default user profile if none exists in localStorage
 */
export function createDefaultUser(): UserProfile {
  const randomId = generateUUID();

  const presetAvatars = ['✈️', '🎒', '🧳', '🗺️', '📸', '🍵', '🍣', '🌸'];
  const randomAvatar = presetAvatars[Math.floor(Math.random() * presetAvatars.length)];
  const presetColors = ['#5B7065', '#8C7A6B', '#2C3E50', '#A85A52', '#6B607A', '#C2884A'];
  const randomColor = presetColors[Math.floor(Math.random() * presetColors.length)];

  return {
    id: randomId,
    name: 'momo',
    avatar_url: randomAvatar,
    color: randomColor,
    last_active: new Date().toISOString(),
  };
}
