/**
 * Public agencies families contact for DD waiver services, by area. These are
 * facts about government agencies, not about Beyon Vital, and each one is
 * taken from the source listed with it (read 2026-11-02).
 */
import { GUIDE_SOURCES } from '@/lib/guides';
import type { LocationSlug } from '@/lib/content';

export type Agency = { name: string; detail: string };

export const chesterfieldCsb: Agency = {
  name: 'Chesterfield Community Services Board',
  detail: 'Main line (804) 748-1227. Serves Chesterfield County; the ZIP codes it lists include 23235, where our home is.'
};

export const chesterfieldDdServices: Agency = {
  name: 'Chesterfield County Developmental Disability Services',
  detail: '804-717-6642. Press one to schedule an intake meeting, or press two to speak with the intake coordinator.'
};

export const richmondRbha: Agency = {
  name: 'Richmond Behavioral Health Authority',
  detail: '107 S. Fifth St., Richmond, VA 23219, (804) 819-4000. Serves the City of Richmond.'
};

export const henricoMhds: Agency = {
  name: 'Henrico Area Mental Health and Developmental Services',
  detail: '(804) 727-8515. Serves Henrico, New Kent and Charles City counties.'
};

/** Per location page: who to call about DD waiver services, with sources. */
export const localAgencies: Record<LocationSlug, { intro: string; agencies: Agency[]; sources: { label: string; url: string }[] }> = {
  'north-chesterfield-va': {
    intro:
      'In Virginia, DD waiver applications go through your local Community Services Board (CSB). North Chesterfield is part of Chesterfield County, so families here apply through the Chesterfield CSB.',
    agencies: [chesterfieldCsb, chesterfieldDdServices],
    sources: [GUIDE_SOURCES.dmasDd, GUIDE_SOURCES.vacsb, GUIDE_SOURCES.chesterfieldDd]
  },
  'chesterfield-county-va': {
    intro:
      'In Virginia, DD waiver applications go through your local Community Services Board (CSB). For Chesterfield County residents, that is the Chesterfield CSB, whose Developmental Disability Services team handles intake.',
    agencies: [chesterfieldDdServices, chesterfieldCsb],
    sources: [GUIDE_SOURCES.dmasDd, GUIDE_SOURCES.chesterfieldDd, GUIDE_SOURCES.vacsb]
  },
  'richmond-va': {
    intro:
      'In Virginia, DD waiver applications go through your local Community Services Board (CSB) or behavioral health authority. Which one depends on where the person lives: the City of Richmond, Henrico County and Chesterfield County each have their own.',
    agencies: [richmondRbha, henricoMhds, chesterfieldCsb],
    sources: [GUIDE_SOURCES.dmasDd, GUIDE_SOURCES.vacsb]
  }
};
