
export function runPipeline(input){
  return {
    mode: "STRICT",
    plan: ["analyze","execute"],
    execution: "generated"
  }
}
