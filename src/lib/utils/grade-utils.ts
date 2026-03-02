"use client";

export type GradeRecord = {
    type: string;
    value: number;
};

export type WeightConfig = {
    type: string;
    weight: number;
};

export function calculateWeightedAverage(grades: GradeRecord[], weights: WeightConfig[]): number {
    if (weights.length === 0) return 0;

    let totalWeightedScore = 0;
    let weightsUsed = 0;

    // We only consider the types defined in the weights config
    weights.forEach(w => {
        // Find the max grade for this type (if there are multiple)
        // In a real scenario, this might be more complex (e.g., average of all 'Trabalho')
        // For this MVP, we group by type and take the average of that type
        const gradesOfType = grades.filter(g => g.type === w.type);
        if (gradesOfType.length > 0) {
            const typeAverage = gradesOfType.reduce((acc, g) => acc + g.value, 0) / gradesOfType.length;
            totalWeightedScore += typeAverage * w.weight;
            weightsUsed += w.weight;
        }
    });

    // Calculate based on the relative weights if not all assessment types were taken yet
    // but usually in Brazil we divide by 10 (the total weight)
    return weightsUsed > 0 ? totalWeightedScore / 10 : 0;
}
