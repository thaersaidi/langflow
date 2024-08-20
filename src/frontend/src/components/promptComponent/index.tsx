import PromptModal from "@/modals/promptModal";
import { useEffect } from "react";
import { PromptAreaComponentType } from "../../types/components";
import IconComponent from "../genericIconComponent";
import { Button } from "../ui/button";

export default function PromptAreaComponent({
  field_name,
  setNodeClass,
  nodeClass,
  value,
  onChange,
  disabled,
  editNode = false,
  id = "",
  readonly = false,
}: PromptAreaComponentType): JSX.Element {
  useEffect(() => {
    if (disabled && value !== "") {
      onChange("", undefined, true);
    }
  }, [disabled]);

  return (
    <div className={disabled ? "pointer-events-none w-full" : "w-full"}>
      <PromptModal
        id={id}
        field_name={field_name}
        readonly={readonly}
        value={value}
        setValue={onChange}
        nodeClass={nodeClass}
        setNodeClass={setNodeClass}
      >
        <Button unstyled className="w-full">
          <div className="flex w-full items-center gap-3">
            <span
              id={id}
              data-testid={id}
              className={
                editNode
                  ? "input-edit-node input-dialog"
                  : (disabled ? "input-disable text-ring " : "") +
                    " primary-input text-muted-foreground"
              }
            >
              {value !== "" ? value : "Type your prompt here..."}
            </span>
            {!editNode && (
              <IconComponent
                id={id}
                name="ExternalLink"
                className={
                  "icons-parameters-comp shrink-0" +
                  (disabled ? " text-ring" : " hover:text-accent-foreground")
                }
              />
            )}
          </div>
        </Button>
      </PromptModal>
    </div>
  );
}
