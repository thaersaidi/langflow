import { cloneDeep } from "lodash";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useUpdateNodeInternals } from "reactflow";
import { default as IconComponent } from "../../../../components/genericIconComponent";
import ShadTooltip from "../../../../components/shadTooltipComponent";
import { Button } from "../../../../components/ui/button";
import { Case } from "../../../../shared/components/caseComponent";
import useFlowStore from "../../../../stores/flowStore";
import { useShortcutsStore } from "../../../../stores/shortcuts";
import { useTypesStore } from "../../../../stores/typesStore";
import {
  NodeOutputFieldComponentType,
  ParameterComponentType,
} from "../../../../types/components";
import {
  getGroupOutputNodeId,
  scapedJSONStringfy,
} from "../../../../utils/reactflowUtils";
import {
  classNames,
  cn,
  isThereModal,
  logHasMessage,
  logTypeIsError,
  logTypeIsUnknown,
} from "../../../../utils/utils";
import OutputComponent from "../OutputComponent";
import HandleRenderComponent from "../handleRenderComponent";
import OutputModal from "../outputModal";

export default function NodeOutputField({
  selected,
  data,
  title,
  id,
  colors,
  tooltipTitle,
  showNode,
  index,
  type,
  outputName,
  outputProxy,
}: NodeOutputFieldComponentType): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const setNode = useFlowStore((state) => state.setNode);
  const myData = useTypesStore((state) => state.data);
  const updateNodeInternals = useUpdateNodeInternals();
  const setFilterEdge = useFlowStore((state) => state.setFilterEdge);
  const [openOutputModal, setOpenOutputModal] = useState(false);
  const flowPool = useFlowStore((state) => state.flowPool);

  let flowPoolId = data.id;
  let internalOutputName = outputName;

  if (data.node?.flow && outputProxy) {
    const realOutput = getGroupOutputNodeId(
      data.node.flow,
      outputProxy.name,
      outputProxy.id,
    );
    if (realOutput) {
      flowPoolId = realOutput.id;
      internalOutputName = realOutput.outputName;
    }
  }

  const flowPoolNode = (flowPool[flowPoolId] ?? [])[
    (flowPool[flowPoolId]?.length ?? 1) - 1
  ];

  const displayOutputPreview =
    !!flowPool[flowPoolId] &&
    logHasMessage(flowPoolNode?.data, internalOutputName);

  const unknownOutput = logTypeIsUnknown(
    flowPoolNode?.data,
    internalOutputName,
  );
  const errorOutput = logTypeIsError(flowPoolNode?.data, internalOutputName);

  const preventDefault = true;

  function handleOutputWShortcut() {
    if (!displayOutputPreview || unknownOutput) return;
    if (selected) {
      setOpenOutputModal((state) => !state);
    }
  }
  const output = useShortcutsStore((state) => state.output);
  useHotkeys(output, handleOutputWShortcut, { preventDefault });

  let disabledOutput =
    edges.some((edge) => edge.sourceHandle === scapedJSONStringfy(id)) ?? false;

  const handleUpdateOutputHide = (value?: boolean) => {
    setNode(data.id, (oldNode) => {
      let newNode = cloneDeep(oldNode);
      newNode.data = {
        ...newNode.data,
        node: {
          ...newNode.data.node,
          outputs: newNode.data.node.outputs?.map((output, i) => {
            if (i === index) {
              output.hidden = value ?? !output.hidden;
            }
            return output;
          }),
        },
      };
      return newNode;
    });
    updateNodeInternals(data.id);
  };

  useEffect(() => {
    if (disabledOutput && data.node?.outputs![index].hidden) {
      handleUpdateOutputHide(false);
    }
  }, [disabledOutput]);

  const Handle = (
    <HandleRenderComponent
      left={false}
      nodes={nodes}
      tooltipTitle={tooltipTitle}
      id={id}
      title={title}
      edges={edges}
      myData={myData}
      colors={colors}
      setFilterEdge={setFilterEdge}
      showNode={showNode}
      testIdComplement={`${data?.type?.toLowerCase()}-${showNode ? "shownode" : "noshownode"}`}
    />
  );

  return !showNode ? (
    Handle
  ) : (
    <div
      ref={ref}
      className="relative mt-1 flex w-full flex-wrap items-center justify-between bg-muted px-5 py-2"
    >
      <>
        <div className="flex w-full items-center justify-end truncate text-sm">
          <div className="flex-1">
            <Button
              disabled={disabledOutput}
              unstyled
              onClick={() => handleUpdateOutputHide()}
              data-testid={`input-inspection-${title.toLowerCase()}`}
            >
              <IconComponent
                className={cn(
                  "h-4 w-4",
                  disabledOutput ? "text-muted-foreground" : "",
                )}
                strokeWidth={1.5}
                name={data.node?.outputs![index].hidden ? "EyeOff" : "Eye"}
              />
            </Button>
          </div>

          {data.node?.frozen && (
            <div className="pr-1">
              <IconComponent className="h-5 w-5 text-ice" name={"Snowflake"} />
            </div>
          )}
          <div className="flex gap-2">
            <span className={data.node?.frozen ? "text-ice" : ""}>
              <OutputComponent
                proxy={outputProxy}
                idx={index}
                types={type?.split("|") ?? []}
                selected={
                  data.node?.outputs![index].selected ??
                  data.node?.outputs![index].types[0] ??
                  title
                }
                nodeId={data.id}
                frozen={data.node?.frozen}
                name={title ?? type}
              />
            </span>
            <ShadTooltip
              content={
                displayOutputPreview
                  ? unknownOutput
                    ? "Output can't be displayed"
                    : "Inspect Output"
                  : "Please build the component first"
              }
            >
              <OutputModal
                disabled={!displayOutputPreview || unknownOutput}
                nodeId={flowPoolId}
                outputName={internalOutputName}
              >
                <Button
                  unstyled
                  disabled={!displayOutputPreview || unknownOutput}
                  data-testid={`output-inspection-${title.toLowerCase()}`}
                >
                  {errorOutput ? (
                    <IconComponent
                      className={classNames(
                        "h-5 w-5 rounded-md text-status-red",
                      )}
                      name={"X"}
                    />
                  ) : (
                    <IconComponent
                      className={classNames(
                        "h-5 w-5 rounded-md",
                        displayOutputPreview && !unknownOutput
                          ? "hover:text-medium-indigo"
                          : "cursor-not-allowed text-muted-foreground",
                      )}
                      name={"ScanEye"}
                    />
                  )}
                </Button>
              </OutputModal>
            </ShadTooltip>
          </div>
        </div>
        {Handle}
      </>
    </div>
  );
}
