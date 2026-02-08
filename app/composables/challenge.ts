export const useChallenge = () => {
  const openChallengeModal = useState<(() => Promise<boolean>) | null>(
    "auth-challenge-fn",
    () => null,
  );

  return {
    openChallengeModal,
  };
};
