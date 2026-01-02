
export interface HealthMetrics {
    bmi: number;
    bmr: number;
    tdee: number;
    weightClass: 'underweight' | 'normal' | 'overweight' | 'obese';
}

/**
 * Calculates BMI (Body Mass Index)
 * Formula: weight (kg) / height (m)^2
 */
export const calculateBMI = (weightKg: number, heightCm: number): number => {
    if (!weightKg || !heightCm) return 0;
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
};

/**
 * Calculates age from birth date
 * Returns current age in years
 */
export const calculateAge = (birthDate: string | null): number => {
    if (!birthDate) return 25; // Default fallback

    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Adjust if birthday hasn't occurred this year yet
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
};

/**
 * Calculates BMR (Basal Metabolic Rate) using the Harris-Benedict Equation
 * Men: BMR = 88.362 + (13.397 × weight in kg) + (4.799 × height in cm) - (5.677 × age in years)
 * Women: BMR = 447.593 + (9.247 × weight in kg) + (3.098 × height in cm) - (4.330 × age in years)
 */
export const calculateBMR = (
    weightKg: number,
    heightCm: number,
    age: number,
    gender: 'male' | 'female'
): number => {
    if (!weightKg || !heightCm || !age) return 0;

    let bmr = 0;
    // Hombres: 66.47 + (13.75 × peso) + (5.003 × altura) - (6.755 × edad)
    // Mujeres: 655.1 + (9.563 × peso) + (1.85 × altura) - (4.676 × edad)
    if (gender === 'male') {
        bmr = 66.47 + (13.75 * weightKg) + (5.003 * heightCm) - (6.755 * age);
    } else {
        bmr = 655.1 + (9.563 * weightKg) + (1.85 * heightCm) - (4.676 * age);
    }

    return Math.round(bmr);
};

/**
 * Calculates TDEE (Total Daily Energy Expenditure)
 * Based on activity multipliers relative to training days
 * 2-3 days: 1.375
 * 4-5 days: 1.55
 * 6 days: 1.725
 */
export const calculateTDEE = (bmr: number, daysPerWeek: number): number => {
    let multiplier = 1.2; // Sedentary / Default

    if (daysPerWeek >= 6) multiplier = 1.725;
    else if (daysPerWeek >= 4) multiplier = 1.55;
    else if (daysPerWeek >= 2) multiplier = 1.375;

    return Math.round(bmr * multiplier);
};

export const getWeightClass = (bmi: number): 'underweight' | 'normal' | 'overweight' | 'obese' => {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
};
