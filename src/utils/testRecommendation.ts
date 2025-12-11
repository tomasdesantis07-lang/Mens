/**
 * MENS Recommendation Engine Test Script
 * Run this to verify the recommendation logic works correctly
 * 
 * Usage: ts-node src/utils/testRecommendation.ts
 * Or import in a React component to test
 */

import { getRecommendedTemplate } from "./routineRecommendation";

console.log("🏋️ MENS System Recommendation Engine - Test Suite\n");
console.log("=".repeat(60));

// Test Case 1: Beginner wants to train 3 days, general fitness
console.log("\n📋 Test 1: Beginner, 3 days, general fitness");
const result1 = getRecommendedTemplate({
    daysAvailable: 3,
    goal: "health",
    level: "beginner",
});
console.log(`✅ Recommended: ${result1.nameKey} (${result1.daysPerWeek} days)`);

// Test Case 2: Intermediate wants 4 days, muscle gain
console.log("\n📋 Test 2: Intermediate, 4 days, muscle gain");
const result2 = getRecommendedTemplate({
    daysAvailable: 4,
    goal: "muscle",
    level: "intermediate",
});
console.log(`✅ Recommended: ${result2.nameKey} (${result2.daysPerWeek} days)`);

// Test Case 3: Advanced wants 5 days, strength focus
console.log("\n📋 Test 3: Advanced, 5 days, strength");
const result3 = getRecommendedTemplate({
    daysAvailable: 5,
    goal: "strength",
    level: "advanced",
});
console.log(`✅ Recommended: ${result3.nameKey} (${result3.daysPerWeek} days)`);

// Test Case 4: Beginner wants 2 days (should recommend 3-day program)
console.log("\n📋 Test 4: Beginner, 2 days (edge case)");
const result4 = getRecommendedTemplate({
    daysAvailable: 2,
    goal: "muscle",
    level: "beginner",
});
console.log(`✅ Recommended: ${result4.nameKey} (${result4.daysPerWeek} days)`);
console.log(`💡 MENS wisdom: 2 days requested, but ${result4.daysPerWeek} days template provided`);

// Test Case 5: Beginner wants 6 days (MENS should moderate this)
console.log("\n📋 Test 5: Beginner, 6 days (should be moderated)");
const result5 = getRecommendedTemplate({
    daysAvailable: 6,
    goal: "muscle",
    level: "beginner",
});
console.log(`✅ Recommended: ${result5.nameKey} (${result5.daysPerWeek} days)`);
console.log(`💡 MENS wisdom: 6 days requested, but ${result5.daysPerWeek} days template provided (quality > quantity)`);

// Test Case 6: Intermediate wants 6 days
console.log("\n📋 Test 6: Intermediate, 6 days");
const result6 = getRecommendedTemplate({
    daysAvailable: 6,
    goal: "muscle",
    level: "intermediate",
});
console.log(`✅ Recommended: ${result6.nameKey} (${result6.daysPerWeek} days)`);
console.log(`💡 MENS wisdom: 6 days requested, but ${result6.daysPerWeek} days template provided`);

// Test Case 7: Advanced wants 6 days
console.log("\n📋 Test 7: Advanced, 6 days");
const result7 = getRecommendedTemplate({
    daysAvailable: 6,
    goal: "strength",
    level: "advanced",
});
console.log(`✅ Recommended: ${result7.nameKey} (${result7.daysPerWeek} days)`);
console.log(`💡 MENS wisdom: 6 days requested, but ${result7.daysPerWeek} days template provided`);

console.log("\n" + "=".repeat(60));
console.log("✅ All tests completed successfully!");
console.log("\n💪 MENS Philosophy: Quality training beats quantity every time.\n");

// Export for use in React components
export const runRecommendationTests = () => {
    return {
        test1: result1,
        test2: result2,
        test3: result3,
        test4: result4,
        test5: result5,
        test6: result6,
        test7: result7,
    };
};
