
export type ActivityCategory = 'Kurikulum' | 'Kokurikulum' | 'HEM' | 'Pentadbiran' | 'Lain-lain';

export interface ActivityPhoto {
  id: string;
  url: string;
  caption: string;
  orientation?: 'landscape' | 'portrait';
}

export interface ActivityRecord {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  category: ActivityCategory;
  objective: string[]; // Diubah kepada array untuk menyokong penomboran dinamik
  participantsCount: string;
  impact: string;
  status: 'Completed' | 'Draft' | 'Pending';
  photos: ActivityPhoto[];
  reporterName: string;
  reporterPosition: string;
  createdAt: number;
}

export type ViewState = 'dashboard' | 'list' | 'add' | 'details' | 'edit';
