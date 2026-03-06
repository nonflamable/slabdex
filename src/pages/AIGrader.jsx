import { useState } from "react";
import { base44 } from "@/api/base44Client";
import GraderSelector from "@/components/aigrader/GraderSelector";
import ConditionForm from "@/components/aigrader/ConditionForm";
import CameraView from "@/components/aigrader/CameraView";
import GradeResult from "@/components/aigrader/GradeResult";

const STAGES = {
  COMPANY: "company",
  FORM: "form",
  CAMERA: "camera",
  ANALYZING: "analyzing",
  RESULT: "result",
};

export default function AIGrader() {
  const [stage, setStage] = useState(STAGES.COMPANY);
  const [company, setCompany] = useState(null);
  const [conditions, setConditions] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCompanySelect = (selectedCompany) => {
    setCompany(selectedCompany);
    setStage(STAGES.FORM);
  };

  const handleFormSubmit = (formData) => {
    setConditions(formData);
    setStage(STAGES.CAMERA);
  };

  const handleImageCapture = async (image) => {
    setImageUrl(image);
    setStage(STAGES.ANALYZING);
    
    // Convert blob to File with proper metadata
    const file = new File([image], "card.jpg", { type: "image/jpeg" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    
    try {
      const gradeResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this Pokémon trading card image and provide a grading assessment based on ${company} standards.

User-reported condition issues:
- Surface scratches: ${conditions.surfaceScratches ? "Yes" : "No"}
- Edge wear: ${conditions.edgeWear ? "Yes" : "No"}
- Corner damage/whitening: ${conditions.cornerDamage ? "Yes" : "No"}
- Centering issues: ${conditions.centeringIssues ? "Yes" : "No"}
- Print lines/defects: ${conditions.printDefects ? "Yes" : "No"}
- Additional notes: ${conditions.notes || "None"}

Please analyze:
1. Centering quality
2. Corner condition
3. Edge condition
4. Surface quality and any visible defects
5. Print quality

Based on ${company} grading standards, provide:
- Estimated grade range (e.g., "PSA 8–9")
- Key factors affecting the grade
- Whether the card realistically meets the higher end of your estimate
- Specific issues detected that impact grading

Be specific and detailed in your assessment.`,
        add_context_from_internet: false,
        file_urls: [file_url],
      });

      setResult(gradeResult);
      setStage(STAGES.RESULT);
    } catch (err) {
      setError(err.message);
      setStage(STAGES.RESULT);
    }
  };

  const handleReset = () => {
    setStage(STAGES.COMPANY);
    setCompany(null);
    setConditions(null);
    setImageUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {stage === STAGES.COMPANY && (
        <GraderSelector onSelect={handleCompanySelect} />
      )}

      {stage === STAGES.FORM && (
        <ConditionForm
          company={company}
          onSubmit={handleFormSubmit}
          onBack={() => setStage(STAGES.COMPANY)}
        />
      )}

      {stage === STAGES.CAMERA && (
        <CameraView
          onCapture={handleImageCapture}
          onClose={() => setStage(STAGES.FORM)}
        />
      )}

      {stage === STAGES.ANALYZING && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            <p className="text-muted-foreground">Analyzing card...</p>
          </div>
        </div>
      )}

      {stage === STAGES.RESULT && (
        <GradeResult
          company={company}
          conditions={conditions}
          imageUrl={imageUrl}
          result={result}
          error={error}
          onReset={handleReset}
        />
      )}
    </div>
  );
}