export const answerQuestionFromHtmlPrompt = () => `
    <objective> 
        Your job is to analyze an HTML page with a login form provided in the user query. 
        Within that form you must find a user-verification question and return an answer to that question.
    </objective>
    <rules>
        Ignore the remaining content of html page and focus strictly on the question.
        Your response must be the answer to that question and nothing else.
        DO NOT ANSWER in full sentence - limit your answer to a single word/number.
        DO NOT repeat the question, DO NOT add any labels to your answer - if the quesion is about the date - respond with just the date, if the question is about the name - respond with just the name etc.
    </rules>
    `;
