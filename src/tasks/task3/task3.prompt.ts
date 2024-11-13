export const answerMultipleQuestionsPrompt = () => `
    <objective> 
        You will be given an array of objects in JSON format with the following structure: {'q': string, 'a': string}.
        For each element in the array you must answer the question from the 'q' field and replace the value of 'a' field of that object with an answer to that question.
        Your output should be an array of objects in JSON format that matches the structure of the input: {'q': string, 'a': string}.
    </objective>
    <rules>
        Value in 'a' field must be the answer to question in 'q' field and nothing else.
        Value in 'a' field must be limited to a single word/name/number - do not add any labels , do not answer in full sentencne..
        Value in 'a' must be in string format, even if it is a number boolean etc - eg: 'true', '123'.
        Your output should be just the array in JSON format and nothing else.
        YOU ARE STRICTLY FORBIDDEN to modify the q field in any of the array elements - the values in 'q' must remain untouched (that includes punctuation, case sensivity etc).
    </rules>
    `;
