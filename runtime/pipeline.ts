export function runPipeline(input: unknown) {
  void input;

  return {
    mode: "STRICT",
    plan: ["analyze", "execute"],
    execution: "generated",
  };
}
