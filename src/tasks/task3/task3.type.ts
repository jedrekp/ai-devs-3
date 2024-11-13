export type TestDataBaseItem = {
  question: string;
  answer: number;
};

export type OpenQuestion = {
  q: string;
  a: string;
};

export type TestDataExtendedItem = TestDataBaseItem & {
  test: OpenQuestion;
};

export function isTestDataExtendedQuestion(item: TestDataBaseItem): item is TestDataExtendedItem {
  return (
    (item as TestDataExtendedItem).test !== undefined &&
    typeof (item as TestDataExtendedItem).test.q === 'string' &&
    typeof (item as TestDataExtendedItem).test.a === 'string'
  );
}

export type TestData = TestDataBaseItem[];
