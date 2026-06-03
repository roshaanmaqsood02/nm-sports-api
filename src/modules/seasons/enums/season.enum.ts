export enum SeasonType {
  CLUB = 'club',
  LEAGUE = 'league',
}

export enum SeasonStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum DataSourceType {
  SCRATCH = 'start_from_scratch',
  FROM_CLUB_IMPORT = 'from_club_import',
  COPY_SUBSEASON = 'copy_subseason',
}

export enum GameIdGeneration {
  NONE = 'none',
  AUTO_GENERATE = 'auto_generate',
}

export enum StaticGroupingType {
  NONE = 'none',
  BY_DIVISION = 'by_division',
  BY_CLUB = 'by_club',
  BY_GENDER = 'by_gender',
  BY_AGE = 'by_age',
  CUSTOM = 'custom',
}

export enum SubseasonStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}
