import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  upload(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ id: string }>(`${this.api}/resume/upload`, fd);
  }

  analyze(id: string, jobDescription?: string) {
  return this.http.post(`${this.api}/resume/${id}/analyze`, {
    jobDescription,
  });
}

  download(id: string, format: 'pdf' | 'docx' = 'pdf', language: 'pt' | 'en' = 'pt') {
    return this.http.get(
      `${this.api}/resume/${id}/download?format=${format}&lang=${language}`,
      { responseType: 'blob' },
    );
  }

  list() {
    return this.http.get<any[]>(`${this.api}/resume`);
  }

  get(id: string) {
    return this.http.get<any>(`${this.api}/resume/${id}`);
  }

  downloadUrl(id: string) {
  return `${this.api}/resume/${id}/download`;
  }


  history(id: string) {
    return this.http.get<any[]>(`${this.api}/resume/${id}/history`);
  }

  compare(id: string) {
    return this.http.get<any>(`${this.api}/resume/${id}/compare`);
  }

  remove(id: string) {
    return this.http.delete(`${this.api}/resume/${id}`);
  }

  generateCoverLetter(resumeId: string, jobDescription?: string) {
    return this.http.post<any>(`${this.api}/cover-letter/${resumeId}/generate`, { jobDescription });
  }

  listCoverLetters(resumeId: string) {
    return this.http.get<any[]>(`${this.api}/cover-letter/${resumeId}`);
  }

  createShare(id: string) {
  return this.http.post<{ token: string }>(`${this.api}/resume/${id}/share`, {});
}

revokeShare(id: string) {
  return this.http.delete(`${this.api}/resume/${id}/share`);
}

getPublic(token: string) {
  return this.http.get<any>(`${this.api}/public/resume/${token}`);
}
}
