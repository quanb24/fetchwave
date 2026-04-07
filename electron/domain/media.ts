export interface FormatOption {
  formatId: string;
  ext: string;
  resolution: string | null;
  fps: number | null;
  vcodec: string | null;
  acodec: string | null;
  filesize: number | null;
  tbr: number | null;
  note: string | null;
}

export interface SubtitleOption {
  language: string;
  name: string | null;
  ext: string;
  url: string | null;
  isAutomatic: boolean;
}

export interface PlaylistEntry {
  id: string;
  title: string;
  url: string;
  duration: number | null;
}

export interface MediaInfo {
  id: string;
  url: string;
  title: string;
  uploader: string | null;
  duration: number | null;
  thumbnail: string | null;
  description: string | null;
  formats: FormatOption[];
  subtitles: SubtitleOption[];
  isPlaylist: boolean;
  playlistCount: number | null;
  entries: PlaylistEntry[];
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  outputFile: string;
  finishedAt: number;
  bytes: number | null;
}
