import type { QuestionDefinition, IdeaAnswer } from "@/types";
import { QuestionCard } from "./QuestionCard";
import { TextareaField } from "./TextareaField";
import { InputField } from "./InputField";
import { ChoiceGroup } from "./ChoiceGroup";
import { MultiSelectChips } from "./MultiSelectChips";
import { InlineFeedback } from "./InlineFeedback";

interface QuestionRendererProps {
  question: QuestionDefinition;
  value: IdeaAnswer["value"] | undefined;
  onChange: (v: IdeaAnswer["value"]) => void;
  index: number;
  total: number;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  index,
  total,
}: QuestionRendererProps) {
  const showWeakFeedback =
    (question.type === "long_text" || question.type === "short_text") &&
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length < 30;

  return (
    <QuestionCard
      label={question.label}
      helperText={question.helper_text}
      required={question.required}
      index={index}
      total={total}
      feedback={
        showWeakFeedback ? (
          <InlineFeedback tone="warning">
            התשובה קצרה מדי כדי לאפשר ניתוח. נסה לפרט יותר.
          </InlineFeedback>
        ) : null
      }
    >
      {question.type === "long_text" && (
        <TextareaField
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          placeholder={question.placeholder}
          rows={5}
        />
      )}
      {question.type === "short_text" && (
        <InputField
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          placeholder={question.placeholder}
        />
      )}
      {question.type === "single_choice" && question.options && (
        <ChoiceGroup
          options={question.options}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      )}
      {question.type === "multi_choice" && question.options && (
        <MultiSelectChips
          options={question.options}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
        />
      )}
    </QuestionCard>
  );
}
