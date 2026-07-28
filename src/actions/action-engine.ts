import type { StigmergyField } from "../network/stigmergy";

export interface ActionProposal {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: string;
  parameters: Record<string, number>;
  proposedAt: number;
}

interface ActionTemplate {
  category: string;
  build: (geneValues: number[], sensorValues: number[], pheromoneSense: Record<string, number | null>) => {
    title: string;
    description: string;
    confidence: number;
    parameters: Record<string, number>;
  };
}

const TEMPLATES: ActionTemplate[] = [
  {
    category: "water",
    build: (genes, sensors) => {
      const waterVal = genes[0] || 0;
      const brightness = sensors[0] || 0.5;
      const moistureTarget = 0.3 + (waterVal + 1) * 0.35;
      const confidence = 0.3 + Math.abs(waterVal) * 0.4;

      const shift = waterVal > 0 ? "early morning" : "evening";
      return {
        title: `${shift === "early morning" ? "Shift watering to early morning" : "Move watering to evening hours"}`,
        description: `Brightness is ${brightness > 0.6 ? "high" : "low"} (${(brightness * 100).toFixed(0)}%). Suggested moisture target: ${(moistureTarget * 100).toFixed(0)}%. This helps reduce evaporation and improve root uptake.`,
        confidence,
        parameters: { moistureTarget, shiftIntensity: Math.abs(waterVal) },
      };
    },
  },
  {
    category: "shade",
    build: (genes, sensors) => {
      const shadeVal = genes.length > 1 ? genes[1] : 0;
      const brightness = sensors[0] || 0.5;
      const exposure = sensors[2] || 0;
      const coverLevel = 0.2 + (shadeVal + 1) * 0.4;
      const confidence = 0.3 + Math.abs(shadeVal - brightness) * 0.5;

      const action = shadeVal > 0 ? "Increase shade cover" : "Reduce shade cover";
      return {
        title: `${action}`,
        description: `Current light exposure is ${(brightness * 100).toFixed(0)}% with motion index ${(exposure * 100).toFixed(0)}%. Recommended cover level: ${(coverLevel * 100).toFixed(0)}%.`,
        confidence,
        parameters: { coverLevel, exposure },
      };
    },
  },
  {
    category: "soil",
    build: (genes, sensors) => {
      const soilVal = genes.length > 2 ? genes[2] : 0;
      const ambientVolume = sensors[3] || 0;
      const amendmentAmount = 0.1 + (soilVal + 1) * 0.3;
      const confidence = 0.3 + Math.abs(soilVal) * 0.35;

      const type = soilVal > 0 ? "biochar" : "compost tea";
      return {
        title: `Apply ${type} to soil`,
        description: `Gene expression suggests soil amendment. Apply ${(amendmentAmount * 100).toFixed(0)}g per sq meter. Ambient noise level: ${(ambientVolume * 100).toFixed(0)}%.`,
        confidence,
        parameters: { amendmentAmount, type: type === "biochar" ? 1 : 0 },
      };
    },
  },
  {
    category: "pest",
    build: (genes, sensors, pheromones) => {
      const stressVal = genes.length > 3 ? genes[3] : 0;
      const motionDelta = sensors[2] || 0;
      const stressPheromone = pheromones.stress ?? null;
      const dangerPheromone = pheromones.danger ?? null;
      const threatLevel = Math.max(
        Math.abs(stressVal) * 0.5 + motionDelta * 0.3,
        stressPheromone ? stressPheromone * 0.4 : 0,
        dangerPheromone ? dangerPheromone * 0.6 : 0
      );
      const confidence = 0.2 + threatLevel * 0.6;

      const severity = threatLevel > 0.6 ? "immediate" : threatLevel > 0.3 ? "moderate" : "low";
      return {
        title: `${severity === "immediate" ? "Pest stress detected - take action" : severity === "moderate" ? "Monitor for pest activity" : "Low pest risk - continue observation"}`,
        description: `Threat level assessed at ${(threatLevel * 100).toFixed(0)}% based on genetic stress indicators, motion ${(motionDelta * 100).toFixed(0)}%, and ${dangerPheromone ? `danger signals from network (${(dangerPheromone * 100).toFixed(0)}%)` : "no network danger signals"}.`,
        confidence,
        parameters: { threatLevel, severity: severity === "immediate" ? 2 : severity === "moderate" ? 1 : 0 },
      };
    },
  },
  {
    category: "planting",
    build: (genes, sensors, pheromones) => {
      const plantVal = genes.length > 4 ? genes[4] : 0;
      const tiltX = sensors[5] || 0;
      const tiltY = sensors[6] || 0;
      const foodPheromone = pheromones.food ?? null;
      const biodiversityScore = 0.2 + (plantVal + 1) * 0.4;

      const pattern = plantVal > 0.3 ? "intercropping" : plantVal < -0.3 ? "border planting" : "mixed guild";
      const confidence = 0.25 + Math.abs(plantVal) * 0.4 + (foodPheromone ? foodPheromone * 0.2 : 0);

      return {
        title: `Try ${pattern} planting pattern`,
        description: `Biodiversity score ${(biodiversityScore * 100).toFixed(0)}%. Device orientation: tilt(${(tiltX * 100).toFixed(0)}%, ${(tiltY * 100).toFixed(0)}%). ${foodPheromone ? `Food signals detected in network (${(foodPheromone * 100).toFixed(0)}%).` : "No food signals from network."}`,
        confidence,
        parameters: { biodiversityScore, pattern: pattern === "intercropping" ? 1 : pattern === "border planting" ? 0 : 0.5 },
      };
    },
  },
];

export class ActionProposalEngine {
  private proposals: ActionProposal[] = [];
  private proposalCounter = 0;

  evaluate(
    geneDataList: Float32Array[],
    sensorArray: Float32Array,
    stigmergyField: StigmergyField | null
  ): ActionProposal[] {
    const sensors: number[] = [];
    for (let i = 0; i < sensorArray.length; i++) {
      sensors.push(sensorArray[i]);
    }

    const geneValues: number[] = [];
    for (const data of geneDataList) {
      if (data.length > 0) {
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        geneValues.push(avg);
      } else {
        geneValues.push(0);
      }
    }

    const pheromoneSense: Record<string, number | null> = {};
    if (stigmergyField) {
      for (const chem of ["food", "danger", "stress", "success", "explore"] as const) {
        const result = stigmergyField.sense(chem);
        pheromoneSense[chem] = result ? result.concentration : null;
      }
    }

    const newProposals: ActionProposal[] = [];
    for (const template of TEMPLATES) {
      const result = template.build(geneValues, sensors, pheromoneSense);
      if (result.confidence < 0.2) continue;

      this.proposalCounter++;
      newProposals.push({
        id: `prop_${this.proposalCounter}`,
        title: result.title,
        description: result.description,
        confidence: Math.min(1, result.confidence),
        category: template.category,
        parameters: result.parameters,
        proposedAt: Date.now(),
      });
    }

    newProposals.sort((a, b) => b.confidence - a.confidence);
    this.proposals = newProposals.slice(0, 3);
    return this.proposals;
  }

  getCurrentProposals(): ActionProposal[] {
    return this.proposals;
  }
}
