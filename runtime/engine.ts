export function runTask(task: string) {
  void task;

  return {
    mode: "STRICT",
    plan: ["analyze", "execute minimal change"],
    execution: "placeholder",
  };
}
