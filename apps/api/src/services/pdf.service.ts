import pdf from 'pdf-parse';

export const parsePdf = async (pdfBuffer: Buffer): Promise<string> => {
  try {
    const data = await pdf(pdfBuffer);
    return cleanText(data.text);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF resume');
  }
};

const cleanText = (text: string): string => {
  // Remove HTML elements/tags
  let cleaned = text.replace(/<\/?[^>]+(>|$)/g, '');
  // Normalize newline sequences
  cleaned = cleaned.replace(/\r\n/g, '\n');
  // Collapse double/multiple horizontal spaces
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  // Collapse excessive consecutive blank lines into double newlines
  cleaned = cleaned.replace(/\n\s*\n+/g, '\n\n');
  return cleaned.trim();
};

export default { parsePdf };
