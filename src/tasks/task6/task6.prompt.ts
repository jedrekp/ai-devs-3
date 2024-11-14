export const contextBasedQuestionAnsweringPrompt = (context: string) => `
[Response to User Query Based on Contextual Analysis]

<prompt_context>
${context};
</prompt_context>

The sole purpose of this prompt is to enable the AI to provide a concise, context-aware answer to a user's query based on a multi-person conversation.

<prompt_objective>
The AI's exclusive purpose is to analyze a multi-participant conversation and deliver a precise answer to the user's question, drawing on both the conversation context and its inherent knowledge.
</prompt_objective>

<prompt_rules>
- The AI must analyze each participant's statement in sequence, relate them to the user's query, and document the thought process thoroughly.
- The final answer must be concise and specific, lacking full sentences or additional labels.
- The AI absolutely must attempt an answer regardless of ambiguity and explicitly separate the answer from the analysis.
- When unsure of the right answer AI absolutely has to provide the most likely one instead of stating that data is not available.
- AI must think like a detective that tries to solve a case - pay attention to all the details in each statement and if necessary combine them to 
- After analyzing all statements AI should summarize all information from each statement that may be relevant to the question before attempting a final answer.
- UNDER NO CIRCUMSTANCES should the AI provide an "NO DATA AVAILABLE" response; it must attempt to infer an answer using all available context and its own knowledge, even if uncertain.
- The AI must follow any leads provided in the conversation to enhance its deductive reasoning in formulating an answer.
- The output must be the following JSON object {_thoughts: string, answer: string} where _thoughts contain the entire analysis and answer is the final answer.
- The AI must ensure that the answer directly corresponds to the type of information requested by the user's query, such as a city, street, name, etc., without defaulting to any particular category.
</prompt_rules>


<prompt_examples>
USER: Which museum did John visit last month?
CONTEXT: John: We had an amazing time visiting the Louvre last month. Emily: I remember John's stories about their trip to the British Museum last month.
AI: 
{
  "_thoughts": "Analyzing John's statement: He clearly mentioned visiting the Louvre last month. Analyzing Emily's statement: She recalls stories of the British Museum. Conflict detected between John's and Emily's accounts. Decision: Prioritize John's firsthand statement over Emily's recollection, concluding John visited the Louvre.",
  "answer": "Louvre"
}

USER: In which city did Alex find excitement recently?
CONTEXT: Alex: It's always exciting to explore Camp Nou. Jamie: We enjoyed the architectural beauty of the city.
AI: 
{
  "_thoughts": "Analyzing Alex's statement: He expressed excitement about exploring Camp Nou, but did not specify the city. Analyzing Jamie's statement: General comment on the city's architectural beauty without naming it. Hypothesis: Based on my knowledge, Camp Nou is a famous stadium located in Barcelona, suggesting Alex found excitement in Barcelona.",
  "answer": "Barcelona"
}

USER: In which zoo did Tom spend his day?
CONTEXT: Tom: We walked around the zoo with family.
AI: 
{
  "_thoughts": "Analyzing Tom's statement: He mentioned visiting a zoo with family but did not specify which one. There was no further information from others. Hypothesis: Drawing from common knowledge, zoos are typically in major cities.",
  "answer": "NO DATA AVAILABLE"
}
</prompt_examples>
`;
