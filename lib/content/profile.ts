import 'server-only';

import connectDB from '@/lib/mongodb';
import Profile from '@/models/Profile';
import type { ProfileData } from '@/types/content';

const PROFILE_UPDATE_FIELDS = [
  'nameEn',
  'nameAr',
  'headlineEn',
  'headlineAr',
  'titleEn',
  'titleAr',
  'subtitleEn',
  'subtitleAr',
  'profileImage',
  'cvFile',
  'summaryEn',
  'summaryAr',
  'aboutEn',
  'aboutAr',
  'aboutImage',
  'email',
  'phone',
  'locationEn',
  'locationAr',
  'github',
  'linkedin',
  'kaggle',
  'whatsapp',
  'twitter',
  'ctaHireMeEn',
  'ctaHireMeAr',
  'ctaDownloadCvEn',
  'ctaDownloadCvAr',
  'availableForWork',
  'availabilityLabelEn',
  'availabilityLabelAr',
] as const;

type ProfileUpdateField = (typeof PROFILE_UPDATE_FIELDS)[number];
type ProfileUpdateInput = Partial<Pick<ProfileData, ProfileUpdateField>>;

function serializeProfile(profile: unknown): ProfileData | null {
  return profile ? JSON.parse(JSON.stringify(profile)) : null;
}

export async function getProfile(options: { createIfMissing?: boolean } = {}) {
  await connectDB();

  const query = Profile.findOne().sort({ updatedAt: -1, createdAt: -1 });
  const existingProfile = await query.lean();

  if (existingProfile || !options.createIfMissing) {
    return serializeProfile(existingProfile);
  }

  const profile = await Profile.create({});
  return serializeProfile(profile.toObject());
}

export function pickProfileUpdate(input: Record<string, unknown>): ProfileUpdateInput {
  return PROFILE_UPDATE_FIELDS.reduce<ProfileUpdateInput>((update, field) => {
    const value = input[field];

    if (field === 'availableForWork') {
      if (typeof value === 'boolean') {
        update[field] = value;
      }
      return update;
    }

    if (typeof value === 'string') {
      update[field] = value;
    }

    return update;
  }, {});
}

export async function saveProfile(input: Record<string, unknown>) {
  await connectDB();

  const update = pickProfileUpdate(input);
  const profile = await Profile.findOneAndUpdate(
    {},
    { $set: update },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      sort: { updatedAt: -1, createdAt: -1 },
    }
  ).lean();

  return serializeProfile(profile);
}
