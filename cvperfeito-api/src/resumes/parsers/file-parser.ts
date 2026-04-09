import  pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

export async function extractText(
  buffer: Buffer,
  mimetype: string,
  filename: string,
): Promise<string> {
  const lowerName = (filename || '').toLowerCase();

  if (mimetype === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const data = await pdfParse(buffer);
    return data.text.trim();
  }

  if (
    mimetype.includes('word') ||
    mimetype.includes('officedocument') ||
    lowerName.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  return buffer.toString('utf-8').trim();
}
