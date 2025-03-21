
import { DeepfakeResult } from "@/lib/types";

// Point to your Flask API endpoint
const API_URL = "http://localhost:5272";

export async function detectDeepfake(file: File): Promise<DeepfakeResult> {
  try {
    const formData = new FormData();
    
    // Determine if the file is an image or video based on its type
    const isVideo = file.type.startsWith('video/');
    
    // Add the file to the form data with the appropriate key
    formData.append(isVideo ? "video" : "image", file);

    // Use the appropriate endpoint based on the file type
    const endpoint = isVideo ? "detect_video" : "detect";
    
    const response = await fetch(`${API_URL}/api/${endpoint}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to analyze ${isVideo ? "video" : "image"}`);
    }

    const result = await response.json();
    
    // Handle the case where the raw prediction is included in the metadata
    if (result.metadata?.rawPrediction !== undefined) {
      // Add a formatted message similar to your Python script output
      result.formattedResult = `Deepfake Probability: ${(result.confidence * 100).toFixed(2)}% -> Predicted as: ${result.isDeepfake ? "FAKE" : "REAL"}`;
    }
    
    // For videos, add a formatted message using the fakeProbability if available
    if (isVideo && result.frameResults?.fakeProbability !== undefined) {
      result.formattedResult = `Deepfake Probability: ${(result.frameResults.fakeProbability * 100).toFixed(2)}% -> Predicted as: ${result.isDeepfake ? "FAKE" : "REAL"}`;
    }

    return result;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// This function can be used to check if the API server is running
export async function checkApiStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/status`, {
      method: "GET",
    });
    return response.ok;
  } catch (error) {
    console.error("API Status Check Error:", error);
    return false;
  }
}
