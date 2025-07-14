
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';
import { RecordType, GeminiExtractedData, HealthMetric, HealthProfile, GeminiMetricExplanation, GeminiHealthInsights, GeminiDailyData, MedicalRecord, GeminiReviewResult } from '../types';

let ai: GoogleGenAI | null = null;

const initializeAi = () => {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.error("Gemini API Key (process.env.API_KEY) is not configured.");
  }
};

initializeAi();

// Helper to create a summarized health profile, excluding large data fields to avoid exceeding token limits.
const createSummarizedHealthProfile = (healthProfile: HealthProfile): Partial<HealthProfile> => {
    // The most important data to exclude is the raw PDF text and data URLs, which can be huge.
    const summarizedRecords = healthProfile.records.map(
        ({ fileDataUrl, extractedText, ...rest }) => rest
    );

    return {
        patient: healthProfile.patient,
        issues: healthProfile.issues,
        metrics: healthProfile.metrics,
        records: summarizedRecords,
    };
};

const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
    try {
        let cleanJsonString = jsonString.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = cleanJsonString.match(fenceRegex);
        if (match && match[2]) {
            cleanJsonString = match[2].trim();
        }
        return JSON.parse(cleanJsonString);
    } catch (error) {
        console.error("Failed to parse JSON string:", jsonString, error);
        return fallback;
    }
}

export const GeminiService = {
  analyzeMedicalText: async (text: string): Promise<GeminiExtractedData> => {
    if (!ai) return [];

    const CHUNK_SIZE = 90000; // Character limit per chunk, ~22.5k tokens, safely under limits.
    const textChunks: string[] = [];
    if (text.length <= CHUNK_SIZE) {
        textChunks.push(text);
    } else {
        let currentPos = 0;
        while(currentPos < text.length) {
            let endPos = Math.min(currentPos + CHUNK_SIZE, text.length);
            // Try to split on a newline to avoid cutting sentences in half.
            if (endPos < text.length) {
                const lastNewline = text.lastIndexOf('\n', endPos);
                // Ensure we make progress, even if a single line is huge
                if (lastNewline > currentPos) {
                    endPos = lastNewline;
                }
            }
            textChunks.push(text.substring(currentPos, endPos));
            currentPos = endPos;
        }
    }

    const recordTypeValues = Object.values(RecordType).join(', ');
    const promptTemplate = (textContent: string) => `You are an AI assistant specialized in parsing medical documents. Your task is to extract key information and a comprehensive list of specific health metrics from the provided medical text. The document may contain entries for multiple, distinct days. You must identify each unique date and group all associated findings under that date. Return a single, valid JSON array of objects. Do not include any explanatory text or markdown code fences around the JSON. Each object in the array represents a single day's data. If the document only pertains to a single day, the array should contain just one object. The structure for each object in the array MUST be: {"date": "The primary date for this set of entries in YYYY-MM-DD format. This is mandatory.", "recordInfo": {"suggestedTitle": "A concise title for the record from this day.", "summary": "A brief summary (2-3 sentences) of events/findings for this day.", "diagnoses": ["An array of strings for diagnoses for this day."], "procedures": ["An array of strings for procedures for this day."], "keyFindings": ["An array of strings for key findings for this day."], "recordTypeSuggestion": "Suggest one type from this list: ${recordTypeValues}"}, "metrics": [{"name": "The name of the metric.", "value": "The value of the metric as a string (e.g., '98.6', '120/80', 'Positive').", "unit": "The unit of measurement (e.g., '°F', 'bpm', 'mg/dL', '').", "category": "The category of the metric from a predefined list."}]} If a value is not found, use null for strings and empty arrays for arrays. The "date" field is mandatory for each daily entry. --- Medical Text to analyze: ${textContent} --- Please provide only the raw JSON array as the response.`;
    
    const promises = textChunks.map(chunk => {
        if (!ai) return Promise.resolve([]);
        const prompt = promptTemplate(chunk);
        return ai.models.generateContent({
            model: GEMINI_MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json", temperature: 0.1 },
        }).then(response => {
            const parsedData = safeJsonParse(response.text, null);
            if (Array.isArray(parsedData)) {
                return (parsedData as GeminiExtractedData).filter(d => d && d.date);
            }
            return [];
        }).catch(error => {
            console.error("Error calling Gemini API for text analysis chunk:", error);
            return []; // Return empty on error, so other chunks can succeed
        });
    });

    const results = await Promise.all(promises);
    const flattenedResults = results.flat();
    
    if (flattenedResults.length === 0) return [];

    // Merge results that may have been split across chunks but share the same date
    const mergedDataMap = new Map<string, GeminiDailyData>();

    for (const dayData of flattenedResults) {
        if (!dayData || !dayData.date) continue;

        const existingEntry = mergedDataMap.get(dayData.date);
        if (!existingEntry) {
            mergedDataMap.set(dayData.date, dayData);
        } else {
            // Merge logic
            const mergedRecordInfo = {
                suggestedTitle: existingEntry.recordInfo.suggestedTitle || dayData.recordInfo.suggestedTitle,
                summary: [existingEntry.recordInfo.summary, dayData.recordInfo.summary].filter(Boolean).join('\n\n'),
                diagnoses: [...new Set([...(existingEntry.recordInfo.diagnoses || []), ...(dayData.recordInfo.diagnoses || [])])],
                procedures: [...new Set([...(existingEntry.recordInfo.procedures || []), ...(dayData.recordInfo.procedures || [])])],
                keyFindings: [...new Set([...(existingEntry.recordInfo.keyFindings || []), ...(dayData.recordInfo.keyFindings || [])])],
                recordTypeSuggestion: existingEntry.recordInfo.recordTypeSuggestion || dayData.recordInfo.recordTypeSuggestion,
            };

            const mergedMetrics = [...(existingEntry.metrics || []), ...(dayData.metrics || [])];
            // De-duplicate metrics based on name, value, and unit to avoid identical entries
            const uniqueMetrics = Array.from(new Map(mergedMetrics.map(m => [`${m.name}|${m.value}|${m.unit}`, m])).values());

            mergedDataMap.set(dayData.date, {
                date: dayData.date,
                recordInfo: mergedRecordInfo,
                metrics: uniqueMetrics
            });
        }
    }
    
    return Array.from(mergedDataMap.values());
  },

  getMetricExplanation: async (metric: HealthMetric, healthProfile: HealthProfile): Promise<GeminiMetricExplanation | null> => {
    if (!ai) return null;
    const summarizedProfile = createSummarizedHealthProfile(healthProfile);
    const prompt = `You are a health education AI. Your task is to provide a personalized analysis of a specific health metric for a patient, using their complete health profile for context. The analysis should be framed as general information for a patient with a similar profile in non-emergency circumstances.

Patient's Health Profile: ${JSON.stringify(summarizedProfile)}
Specific Metric to Analyze: ${JSON.stringify(metric)}

Return a single, raw JSON object with the following structure. Do not include any text or markdown formatting outside the JSON object.

{
  "description": "What this metric measures and its importance in the body.",
  "normalRange": "The typical normal range for this metric, specifically tailored to a patient of this age and sex (if provided). If sex is not provided, state the general range and mention how it can vary.",
  "causesForDeviation": "Common reasons why this value might be higher or lower than the personalized normal range.",
  "improvementPlan": "General lifestyle, diet, or monitoring suggestions to help improve or maintain healthy levels, presented as educational information, not medical advice.",
  "patientSpecificImpact": "Based on the patient's specific value and their overall health profile (including conditions, other metrics, and age), explain what this reading could signify. Use cautious language like 'could indicate' or 'might be related to'. Always conclude by strongly recommending consultation with a doctor for any health concerns."
}`;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json", temperature: 0.3 }
        });
        return safeJsonParse<GeminiMetricExplanation | null>(response.text, null);
    } catch (error) {
        console.error("Error getting metric explanation from Gemini:", error);
        return null;
    }
  },

  createChatSession: (healthProfile: HealthProfile, systemInstructionOverride?: string): Chat | null => {
    if (!ai) return null;
    const summarizedProfile = createSummarizedHealthProfile(healthProfile);
    const systemInstruction = systemInstructionOverride || `You are an AI health assistant providing personalized information based on a patient's health data. You must adhere to the following rules:
1.  **Personalize All Responses**: Use the provided patient health profile to tailor every response. When discussing metrics or conditions, your explanations and comparisons must be relevant to the patient's specific data (e.g., age, sex, stats, existing issues).
2.  **Use Contextual Averages**: When providing "normal" ranges or averages for comparison, they must be appropriate for a patient with a similar profile (age, sex, etc.). Frame this as "For a person of this age and sex..." or similar.
3.  **No Medical Advice**: You MUST NOT give medical advice, diagnoses, or treatment plans. Your role is educational. Always conclude by advising the user to consult a qualified healthcare professional for any medical concerns.
4.  **Data-Driven**: Base your answers strictly on the health data provided. If you don't have information, say so.
5.  **Tone**: Be empathetic, clear, and supportive. The context is a non-emergency, informational discussion.

Here is the complete health profile for the patient in question: ${JSON.stringify(summarizedProfile)}`;
    
    return ai.chats.create({
        model: GEMINI_MODEL_NAME,
        config: {
            systemInstruction,
            temperature: 0.5,
        }
    });
  },

  getOverallHealthInsights: async (healthProfile: HealthProfile): Promise<GeminiHealthInsights | null> => {
    if (!ai) return null;
    const summarizedProfile = createSummarizedHealthProfile(healthProfile);
    const prompt = `You are a health analysis AI. Your task is to review a patient's complete health profile and provide a holistic summary. The profile includes personal details (like age), medical records, a history of various health metrics, and a list of ongoing or past health issues. Based on all the provided data, generate a single JSON object with the following structure. Do not include any text outside the JSON. {"overallSummary": "A brief, high-level summary of the patient's current health status based on the provided data.", "notableTrends": ["An array of strings, where each string describes a significant trend or pattern you've identified (e.g., 'Blood pressure has been trending downwards over the last 3 months.', 'Recent lab results show elevated WBC count, which could be related to the active 'Infection' issue.')."],"potentialConnections": ["An array of strings highlighting potential connections between different data points that might be worth discussing with a doctor (e.g., 'The patient's fatigue notes coincide with a drop in hemoglobin levels.', 'The new medication 'Lisinopril' was started shortly before the 'Cough' issue was logged.')."], "questionsForDoctor": ["An array of strings with suggested, well-formed questions the user could ask their doctor at their next appointment to better understand their health. (e.g., 'What could be causing the recent fluctuations in my blood glucose levels?', 'Are there any non-pharmacological ways I can manage my cholesterol?')."]} Here is the patient's health profile: ${JSON.stringify(summarizedProfile)}`;
    
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json", temperature: 0.4 }
        });
        return safeJsonParse<GeminiHealthInsights | null>(response.text, null);
    } catch(error) {
        console.error("Error getting health insights from Gemini:", error);
        return null;
    }
  },

  reviewRecordsForAbnormalities: async (records: MedicalRecord[], healthProfile: HealthProfile): Promise<GeminiReviewResult | null> => {
    if (!ai) return null;

    const summarizedRecords = records.map(
        ({ fileDataUrl, extractedText, geminiSummary, ...rest }) => rest
    );
    const summarizedProfile = createSummarizedHealthProfile(healthProfile);
    
    const prompt = `You are a meticulous clinical data analyst AI. Your task is to review a set of medical records for a patient and identify any abnormalities, unusual patterns, potential medical errors, or deviations from the standard of care. Analyze each record individually and then analyze all records as a whole to find cross-record connections. Use the patient's full health profile for context (age, sex, known issues, etc.).

Patient's Health Profile: ${JSON.stringify(summarizedProfile)}
Medical Records to Review: ${JSON.stringify(summarizedRecords)}

Return a single, raw JSON object with the following structure. Do not include any text or markdown formatting outside the JSON object.

{
  "overallAssessment": "A high-level summary of your review of all records provided, noting the general state and any overarching concerns.",
  "individualRecordFindings": [{
    "recordId": "The ID of the medical record.",
    "recordTitle": "The title of the medical record.",
    "findings": [{
      "observation": "A specific data point or finding observed in the record (e.g., 'WBC count of 15.2 x10^9/L', 'Medication Lisinopril prescribed').",
      "context": "Relevant context from the patient's profile or other records (e.g., 'Patient has a known issue of 'Hypertension'.', 'This follows a record showing signs of infection.').",
      "assessment": "Your assessment of the observation. Is it expected? Is it unusual? Does it align with the standard of care?",
      "potentialConcernLevel": "Classify the concern level as 'Normal', 'Moderate', or 'High'.",
      "reasoning": "Explain why you assigned that concern level. Be specific."
    }]
  }],
  "crossRecordConnections": [{
    "observation": "A finding that connects two or more records (e.g., 'Patient was prescribed antibiotic A on YYYY-MM-DD, but lab results on YYYY-MM-DD+2 show the infection is resistant to it.').",
    "implication": "What this connection might imply for the patient's care.",
    "recommendation": "A suggested action or discussion point for the patient, e.g., 'Patient may want to ask their doctor if the antibiotic should be changed.'"
  }],
  "questionsForDoctor": ["An array of well-formed questions the user could ask their doctor based on your complete analysis."]
}`;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: "application/json", temperature: 0.2 }
        });
        return safeJsonParse<GeminiReviewResult | null>(response.text, null);
    } catch(error) {
        console.error("Error getting record review from Gemini:", error);
        return null;
    }
  }
};
