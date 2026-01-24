export interface DetectionResult {
  label: string;
  confidence: number;
}

class DeepfakeDetector {
  private _isModelLoaded: boolean = false;
  private readonly BACKEND_URL = "http://localhost:4000/api"; // Updated to match backend config

  isModelLoaded(): boolean {
    // Since we are using the backend, the "model" is effectively always "loaded" 
    // once we confirm the backend is reachable, or we can just return true 
    // and let the analyze step handle connection errors.
    // However, the UI expects a loading phase. We can simulate it or check health.
    return this._isModelLoaded;
  }

  async loadModel(): Promise<void> {
    // In a real client-side app, this would load the TFJS model.
    // Here, we can treat this as a "backend health check" or simply a simulation.
    console.log("Connecting to detection backend...");
    
    try {
        // Optional: Ping the backend to ensure it's up.
        // For now, we'll just simulate a delay to mimic model loading 
        // if we want to preserve the UI experience, or just mark as loaded.
        this._isModelLoaded = true;
        return Promise.resolve();
    } catch (error) {
        console.error("Failed to connect to backend", error);
        throw error;
    }
  }

  analyzeVideo(
    file: File, 
    onProgress: (message: string) => void
  ): Promise<DetectionResult> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      
      // Configure the request
      xhr.open("POST", `${this.BACKEND_URL}/detect-video`, true);
      
      // Get the token if available (though the backend might not strictly require it for this endpoint yet, 
      // based on detect.py it doesn't seem to enforce auth header check explicitly, but good practice)
      const token = window.localStorage.getItem("realeye_token");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          if (percentComplete < 100) {
            onProgress(`Uploading video... ${percentComplete}%`);
          } else {
            onProgress("Processing video on server...");
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Backend returns: { label: "REAL" | "FAKE", score: number, message: string }
            // Frontend expects: { label: string, confidence: number }
            
            const result: DetectionResult = {
              label: response.label,
              confidence: response.score // Map score (0-1) to confidence for frontend use
            };
            resolve(result);
          } catch (e) {
            reject(new Error("Failed to parse server response"));
          }
        } else {
          try {
            const errorResp = JSON.parse(xhr.responseText);
            reject(new Error(errorResp.detail || "Server error during analysis"));
          } catch (e) {
            reject(new Error(`Server returned status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error(`Network error occurred while connecting to ${this.BACKEND_URL}/detect-video. Please ensure the backend server is running.`));
      };

      xhr.send(formData);
    });
  }
}

export const deepfakeDetector = new DeepfakeDetector();
