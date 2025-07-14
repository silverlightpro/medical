// Use a dynamic import for pdfjs-dist to avoid issues with SSR or Node environments if this code were to run there.
// For client-side only, direct import is fine but this is safer.
let pdfjsLib: any = null;

const getPdfjsLib = async () => {
  if (!pdfjsLib) {
    // @ts-ignore
    pdfjsLib = await import(/* webpackIgnore: true */ 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.min.mjs');
    // @ts-ignore
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs';
  }
  return pdfjsLib;
};


export const PdfService = {
  extractTextFromFile: async (file: File): Promise<string> => {
    const lib = await getPdfjsLib();
    if (!lib) {
        throw new Error("PDF.js library could not be loaded.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return fullText;
  },

  fileToDataURL: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }
};