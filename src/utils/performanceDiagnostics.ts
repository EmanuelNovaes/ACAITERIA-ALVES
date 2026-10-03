const diagnosticOrigin = performance.now();

export const diagnosticNow = () => performance.now();

export const reportPerformance = (
  stage: string,
  details: Record<string, unknown> = {},
  durationMs?: number
) => {
  const elapsedMs = performance.now() - diagnosticOrigin;
  console.info('[menu perf] ' + JSON.stringify({
    stage,
    elapsedMs: Number(elapsedMs.toFixed(1)),
    ...(durationMs === undefined ? {} : { durationMs: Number(durationMs.toFixed(1)) }),
    ...details,
  }));
};

reportPerformance('Início da linha do tempo do App');
