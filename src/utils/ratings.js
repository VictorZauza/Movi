export const clampVoteAverage = (vote = 0) => {
  if (Number.isNaN(Number(vote))) {
    return 0;
  }

  return Math.min(10, Math.max(0, Number(vote)));
};

export const convertVoteAverageToStars = (voteAverage = 0) => {
  const clamped = clampVoteAverage(voteAverage);
  return Math.round((clamped / 2) * 2) / 2;
};

