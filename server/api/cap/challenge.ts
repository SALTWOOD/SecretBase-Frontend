import cap from "~~/server/utils/cap";

export default defineEventHandler(async (event) => {
  return await cap.createChallenge({
    challengeSize: 64,
    challengeCount: 64,
    challengeDifficulty: 4,
  });
});
