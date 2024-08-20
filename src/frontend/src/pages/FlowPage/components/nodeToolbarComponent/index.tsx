import { countHandlesFn } from "@/CustomNodes/helpers/count-handles";
import useHandleOnNewValue from "@/CustomNodes/hooks/use-handle-new-value";
import useHandleNodeClass from "@/CustomNodes/hooks/use-handle-node-class";
import { usePostRetrieveVertexOrder } from "@/controllers/API/queries/vertex";
import useAddFlow from "@/hooks/flows/use-add-flow";
import { APIClassType } from "@/types/api";
import _, { cloneDeep } from "lodash";
import { useEffect, useState } from "react";
import { useUpdateNodeInternals } from "reactflow";
import CodeAreaComponent from "../../../../components/codeAreaComponent";
import IconComponent from "../../../../components/genericIconComponent";
import ShadTooltip from "../../../../components/shadTooltipComponent";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../../../components/ui/select-custom";
import ConfirmationModal from "../../../../modals/confirmationModal";
import EditNodeModal from "../../../../modals/editNodeModal";
import ShareModal from "../../../../modals/shareModal";
import useAlertStore from "../../../../stores/alertStore";
import { useDarkStore } from "../../../../stores/darkStore";
import useFlowStore from "../../../../stores/flowStore";
import useFlowsManagerStore from "../../../../stores/flowsManagerStore";
import { useShortcutsStore } from "../../../../stores/shortcuts";
import { useStoreStore } from "../../../../stores/storeStore";
import { nodeToolbarPropsType } from "../../../../types/components";
import { FlowType } from "../../../../types/flow";
import {
  createFlowComponent,
  downloadNode,
  expandGroupNode,
  updateFlowPosition,
} from "../../../../utils/reactflowUtils";
import {
  classNames,
  cn,
  getNodeLength,
  openInNewTab,
} from "../../../../utils/utils";
import useShortcuts from "./hooks/use-shortcuts";
import ShortcutDisplay from "./shortcutDisplay";
import ToolbarSelectItem from "./toolbarSelectItem";

export default function NodeToolbarComponent({
  data,
  deleteNode,
  setShowNode,
  numberOfOutputHandles,
  showNode,
  name = "code",
  setShowState,
  onCloseAdvancedModal,
  updateNode,
  isOutdated,
}: nodeToolbarPropsType): JSX.Element {
  const version = useDarkStore((state) => state.version);
  const [showModalAdvanced, setShowModalAdvanced] = useState(false);
  const [showconfirmShare, setShowconfirmShare] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [flowComponent, setFlowComponent] = useState<FlowType>(
    createFlowComponent(cloneDeep(data), version),
  );
  const nodeLength = getNodeLength(data);
  const updateFreezeStatus = useFlowStore((state) => state.updateFreezeStatus);
  const hasStore = useStoreStore((state) => state.hasStore);
  const hasApiKey = useStoreStore((state) => state.hasApiKey);
  const validApiKey = useStoreStore((state) => state.validApiKey);
  const shortcuts = useShortcutsStore((state) => state.shortcuts);
  const unselectAll = useFlowStore((state) => state.unselectAll);
  const currentFlowId = useFlowsManagerStore((state) => state.currentFlowId);
  const [openModal, setOpenModal] = useState(false);
  const isGroup = data.node?.flow ? true : false;
  const frozen = data.node?.frozen ?? false;

  const addFlow = useAddFlow();

  const isMinimal = countHandlesFn(data) <= 1 && numberOfOutputHandles <= 1;

  function minimize() {
    if (isMinimal) {
      setShowState((show) => !show);
      setShowNode(data.showNode ?? true ? false : true);
      return;
    }
    setNoticeData({
      title:
        "Minimization are only available for components with one handle or fewer.",
    });
    return;
  }

  function handleungroup() {
    if (isGroup) {
      takeSnapshot();
      expandGroupNode(
        data.id,
        updateFlowPosition(getNodePosition(data.id), data.node?.flow!),
        data.node!.template,
        nodes,
        edges,
        setNodes,
        setEdges,
        data.node?.outputs,
      );
    }
  }

  function shareComponent() {
    if (hasApiKey || hasStore) {
      setShowconfirmShare((state) => !state);
    }
  }

  function handleCodeModal() {
    if (!hasCode)
      setNoticeData({ title: `You can not access ${data.id} code` });
    setOpenModal((state) => !state);
  }

  function saveComponent() {
    if (isSaved) {
      setShowOverrideModal((state) => !state);
      return;
    }
    addFlow({
      flow: flowComponent,
      override: false,
    });
    setSuccessData({ title: `${data.id} saved successfully` });
    return;
  }

  function openDocs() {
    if (data.node?.documentation) {
      return openInNewTab(data.node?.documentation);
    }
    setNoticeData({
      title: `${data.id} docs is not available at the moment.`,
    });
  }

  const freezeFunction = () => {
    setNode(data.id, (old) => ({
      ...old,
      data: {
        ...old.data,
        node: {
          ...old.data.node,
          frozen: old.data?.node?.frozen ? false : true,
        },
      },
    }));
  };

  useShortcuts({
    showOverrideModal,
    showModalAdvanced,
    openModal,
    showconfirmShare,
    FreezeAllVertices: () => {
      FreezeAllVertices({ flowId: currentFlowId, stopNodeId: data.id });
    },
    Freeze: freezeFunction,
    downloadFunction: () => downloadNode(flowComponent!),
    displayDocs: openDocs,
    saveComponent,
    showAdvance: () => setShowModalAdvanced((state) => !state),
    handleCodeModal,
    shareComponent,
    ungroup: handleungroup,
    minimizeFunction: minimize,
  });

  const paste = useFlowStore((state) => state.paste);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const setNodes = useFlowStore((state) => state.setNodes);
  const setEdges = useFlowStore((state) => state.setEdges);
  const getNodePosition = useFlowStore((state) => state.getNodePosition);
  const flows = useFlowsManagerStore((state) => state.flows);
  const takeSnapshot = useFlowsManagerStore((state) => state.takeSnapshot);
  const { mutate: FreezeAllVertices } = usePostRetrieveVertexOrder({
    onSuccess: ({ vertices_to_run }) => {
      updateFreezeStatus(vertices_to_run, !data.node?.frozen);
      vertices_to_run.forEach((vertex) => {
        updateNodeInternals(vertex);
      });
    },
  });

  useEffect(() => {
    if (!showModalAdvanced) {
      onCloseAdvancedModal!(false);
    }
  }, [showModalAdvanced]);
  const updateNodeInternals = useUpdateNodeInternals();

  const setLastCopiedSelection = useFlowStore(
    (state) => state.setLastCopiedSelection,
  );

  const setSuccessData = useAlertStore((state) => state.setSuccessData);
  const setNoticeData = useAlertStore((state) => state.setNoticeData);

  useEffect(() => {
    setFlowComponent(createFlowComponent(cloneDeep(data), version));
  }, [
    data,
    data.node,
    data.node?.display_name,
    data.node?.description,
    data.node?.template,
    showModalAdvanced,
    showconfirmShare,
  ]);

  const handleSelectChange = (event) => {
    switch (event) {
      case "save":
        saveComponent();
        break;
      case "freeze":
        freezeFunction();
        break;
      case "freezeAll":
        FreezeAllVertices({ flowId: currentFlowId, stopNodeId: data.id });
        break;
      case "code":
        setOpenModal(!openModal);
        break;
      case "advanced":
        setShowModalAdvanced(true);
        break;
      case "show":
        takeSnapshot();
        minimize();
        break;
      case "Share":
        shareComponent();
        break;
      case "Download":
        downloadNode(flowComponent!);
        break;
      case "SaveAll":
        addFlow({
          flow: flowComponent,
          override: false,
        });
        break;
      case "documentation":
        openDocs();
        break;
      case "disabled":
        break;
      case "unselect":
        unselectAll();
        break;
      case "ungroup":
        handleungroup();
        break;
      case "override":
        setShowOverrideModal(true);
        break;
      case "delete":
        deleteNode(data.id);
        break;
      case "update":
        updateNode();
        break;
      case "copy":
        const node = nodes.filter((node) => node.id === data.id);
        setLastCopiedSelection({ nodes: _.cloneDeep(node), edges: [] });
        break;
      case "duplicate":
        paste(
          {
            nodes: [nodes.find((node) => node.id === data.id)!],
            edges: [],
          },
          {
            x: 50,
            y: 10,
            paneX: nodes.find((node) => node.id === data.id)?.position.x,
            paneY: nodes.find((node) => node.id === data.id)?.position.y,
          },
        );
        break;
    }
  };

  const isSaved = flows?.some((flow) =>
    Object.values(flow).includes(data.node?.display_name!),
  );

  const setNode = useFlowStore((state) => state.setNode);

  const { handleOnNewValue: handleOnNewValueHook } = useHandleOnNewValue({
    node: data.node!,
    nodeId: data.id,
    name,
  });

  const handleOnNewValue = (value: string | string[]) => {
    handleOnNewValueHook({ value });
  };

  const { handleNodeClass: handleNodeClassHook } = useHandleNodeClass(data.id);

  const handleNodeClass = (newNodeClass: APIClassType, type: string) => {
    handleNodeClassHook(newNodeClass, type);
  };

  const hasCode = Object.keys(data.node!.template).includes("code");
  const [deleteIsFocus, setDeleteIsFocus] = useState(false);

  return (
    <>
      <div className="w-26 noflow nowheel nopan nodelete nodrag h-10">
        <span className="isolate inline-flex rounded-md shadow-sm">
          {hasCode && (
            <ShadTooltip
              content={
                <ShortcutDisplay
                  {...shortcuts.find(
                    ({ name }) => name.split(" ")[0].toLowerCase() === "code",
                  )!}
                />
              }
              side="top"
            >
              <button
                className="relative inline-flex items-center rounded-l-md bg-background px-2 py-2 text-foreground shadow-md ring-1 ring-inset ring-ring transition-all duration-500 ease-in-out hover:bg-muted focus:z-10"
                onClick={() => {
                  setOpenModal(!openModal);
                }}
                data-testid="code-button-modal"
              >
                <IconComponent name="Code" className="h-4 w-4" />
              </button>
            </ShadTooltip>
          )}
          {nodeLength > 0 && (
            <ShadTooltip
              content={
                <ShortcutDisplay
                  {...shortcuts.find(
                    ({ name }) =>
                      name.split(" ")[0].toLowerCase() === "advanced",
                  )!}
                />
              }
              side="top"
            >
              <button
                className={`${
                  isGroup ? "rounded-l-md" : ""
                } relative -ml-px inline-flex items-center bg-background px-2 py-2 text-foreground shadow-md ring-1 ring-inset ring-ring transition-all duration-500 ease-in-out hover:bg-muted focus:z-10`}
                onClick={() => {
                  setShowModalAdvanced(true);
                }}
                data-testid="advanced-button-modal"
              >
                <IconComponent name="Settings2" className="h-4 w-4" />
              </button>
            </ShadTooltip>
          )}

          <ShadTooltip
            content={
              <ShortcutDisplay
                {...shortcuts.find(
                  ({ name }) => name.toLowerCase() === "freeze path",
                )!}
              />
            }
            side="top"
          >
            <button
              className={classNames(
                "relative -ml-px inline-flex items-center bg-background px-2 py-2 text-foreground shadow-md ring-1 ring-inset ring-ring transition-all duration-500 ease-in-out hover:bg-muted focus:z-10",
              )}
              onClick={(event) => {
                event.preventDefault();
                takeSnapshot();
                FreezeAllVertices({
                  flowId: currentFlowId,
                  stopNodeId: data.id,
                });
              }}
            >
              <IconComponent
                name="FreezeAll"
                className={cn(
                  "h-4 w-4 transition-all",
                  // TODO UPDATE THIS COLOR TO BE A VARIABLE
                  frozen ? "animate-wiggle text-ice" : "",
                )}
              />
            </button>
          </ShadTooltip>

          <Select onValueChange={handleSelectChange} value="">
            <ShadTooltip content="All" side="top">
              <SelectTrigger>
                <div>
                  <div
                    data-testid="more-options-modal"
                    className={classNames(
                      "relative -ml-px inline-flex h-8 w-[2rem] items-center rounded-r-md bg-background text-foreground shadow-md ring-1 ring-inset ring-ring transition-all duration-500 ease-in-out hover:bg-muted focus:z-10",
                    )}
                  >
                    <IconComponent
                      name="MoreHorizontal"
                      className="relative left-2 h-4 w-4"
                    />
                  </div>
                </div>
              </SelectTrigger>
            </ShadTooltip>
            <SelectContent>
              {hasCode && (
                <SelectItem value={"code"}>
                  <ToolbarSelectItem
                    shortcut={
                      shortcuts.find((obj) => obj.name === "Code")?.shortcut!
                    }
                    value={"Code"}
                    icon={"Code"}
                    dataTestId="code-button-modal"
                  />
                </SelectItem>
              )}
              {nodeLength > 0 && (
                <SelectItem value={nodeLength === 0 ? "disabled" : "advanced"}>
                  <ToolbarSelectItem
                    shortcut={
                      shortcuts.find((obj) => obj.name === "Advanced Settings")
                        ?.shortcut!
                    }
                    value={"Advanced"}
                    icon={"Settings2"}
                    dataTestId="edit-button-modal"
                  />
                </SelectItem>
              )}
              <SelectItem value={"save"}>
                <ToolbarSelectItem
                  shortcut={
                    shortcuts.find((obj) => obj.name === "Save Component")
                      ?.shortcut!
                  }
                  value={"Save"}
                  icon={"SaveAll"}
                  dataTestId="save-button-modal"
                />
              </SelectItem>
              <SelectItem value={"duplicate"}>
                <ToolbarSelectItem
                  shortcut={
                    shortcuts.find((obj) => obj.name === "Duplicate")?.shortcut!
                  }
                  value={"Duplicate"}
                  icon={"Copy"}
                  dataTestId="copy-button-modal"
                />
              </SelectItem>
              <SelectItem value={"copy"}>
                <ToolbarSelectItem
                  shortcut={
                    shortcuts.find((obj) => obj.name === "Copy")?.shortcut!
                  }
                  value={"Copy"}
                  icon={"Clipboard"}
                  dataTestId="copy-button-modal"
                />
              </SelectItem>
              {isOutdated && (
                <SelectItem value={"update"}>
                  <ToolbarSelectItem
                    shortcut={
                      shortcuts.find((obj) => obj.name === "Update")?.shortcut!
                    }
                    value={"Restore"}
                    icon={"RefreshCcwDot"}
                    dataTestId="update-button-modal"
                  />
                </SelectItem>
              )}
              {hasStore && (
                <SelectItem
                  value={"Share"}
                  disabled={!hasApiKey || !validApiKey}
                >
                  <ToolbarSelectItem
                    shortcut={
                      shortcuts.find((obj) => obj.name === "Component Share")
                        ?.shortcut!
                    }
                    value={"Share"}
                    icon={"Share3"}
                    dataTestId="share-button-modal"
                  />
                </SelectItem>
              )}

              <SelectItem
                value={"documentation"}
                disabled={data.node?.documentation === ""}
              >
                <ToolbarSelectItem
                  shortcut={
                    shortcuts.find((obj) => obj.name === "Docs")?.shortcut!
                  }
                  value={"Docs"}
                  icon={"FileText"}
                  dataTestId="docs-button-modal"
                />
              </SelectItem>
              {isMinimal && (
                <SelectItem value={"show"}>
                  <ToolbarSelectItem
                    shortcut={
                      shortcuts.find((obj) => obj.name === "Minimize")
                        ?.shortcut!
                    }
                    value={showNode ? "Minimize" : "Expand"}
                    icon={showNode ? "Minimize2" : "Maximize2"}
                    dataTestId="minimize-button-modal"
                  />
                </SelectItem>
              )}
              {isGroup && (
                <SelectItem value="ungroup">
                  <ToolbarSelectItem
                    shortcut={
                      shortcuts.find((obj) => obj.name === "Group")?.shortcut!
                    }
                    value={"Ungroup"}
                    icon={"Ungroup"}
                    dataTestId="group-button-modal"
                  />
                </SelectItem>
              )}
              <SelectItem value="freeze">
                <ToolbarSelectItem
                  shortcut={
                    shortcuts.find((obj) => obj.name === "Freeze")?.shortcut!
                  }
                  value={"Freeze"}
                  icon={"Snowflake"}
                  dataTestId="freeze-button"
                  style={`${frozen ? " text-ice" : ""} transition-all`}
                />
              </SelectItem>
              <SelectItem value="freezeAll">
                <ToolbarSelectItem
                  shortcut={
                    shortcuts.find((obj) => obj.name === "Freeze Path")
                      ?.shortcut!
                  }
                  value={"Freeze Path"}
                  icon={"FreezeAll"}
                  dataTestId="freeze-path-button"
                  style={`${frozen ? " text-ice" : ""} transition-all`}
                />
              </SelectItem>
              <SelectItem value="Download">
                <ToolbarSelectItem
                  shortcut={
                    shortcuts.find((obj) => obj.name === "Download")?.shortcut!
                  }
                  value={"Download"}
                  icon={"Download"}
                  dataTestId="download-button-modal"
                />
              </SelectItem>
              <SelectItem
                value={"delete"}
                className="focus:bg-red-400/[.20]"
                onFocus={() => setDeleteIsFocus(true)}
                onBlur={() => setDeleteIsFocus(false)}
              >
                <div className="font-red flex text-status-red">
                  <IconComponent
                    name="Trash2"
                    className="relative top-0.5 mr-2 h-4 w-4"
                  />{" "}
                  <span className="">Delete</span>{" "}
                  <span
                    className={`absolute right-2 top-2 flex items-center justify-center rounded-sm px-1 py-[0.2] ${
                      deleteIsFocus ? " " : "bg-muted"
                    }`}
                  >
                    <IconComponent
                      name="Delete"
                      className="h-4 w-4 stroke-2 text-red-400"
                    ></IconComponent>
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <ConfirmationModal
            open={showOverrideModal}
            title={`Replace`}
            cancelText="Create New"
            confirmationText="Replace"
            size={"x-small"}
            icon={"SaveAll"}
            index={6}
            onConfirm={(index, user) => {
              addFlow({
                flow: flowComponent,
                override: true,
              });
              setSuccessData({ title: `${data.id} successfully overridden!` });
            }}
            onClose={() => setShowOverrideModal(false)}
            onCancel={() => {
              addFlow({
                flow: flowComponent,
                override: true,
              });
              setSuccessData({ title: "New component successfully saved!" });
            }}
          >
            <ConfirmationModal.Content>
              <span>
                It seems {data.node?.display_name} already exists. Do you want
                to replace it with the current or create a new one?
              </span>
            </ConfirmationModal.Content>
          </ConfirmationModal>
          {showModalAdvanced && (
            <EditNodeModal
              data={data}
              open={showModalAdvanced}
              setOpen={setShowModalAdvanced}
            />
          )}
          {showconfirmShare && (
            <ShareModal
              open={showconfirmShare}
              setOpen={setShowconfirmShare}
              is_component={true}
              component={flowComponent!}
            />
          )}
          {hasCode && (
            <div className="hidden">
              {openModal && (
                <CodeAreaComponent
                  open={openModal}
                  setOpen={setOpenModal}
                  readonly={
                    data.node?.flow && data.node.template[name].dynamic
                      ? true
                      : false
                  }
                  dynamic={data.node?.template[name].dynamic ?? false}
                  setNodeClass={handleNodeClass}
                  nodeClass={data.node}
                  disabled={false}
                  value={data.node?.template[name].value ?? ""}
                  onChange={handleOnNewValue}
                  id={"code-input-node-toolbar-" + name}
                />
              )}
            </div>
          )}
        </span>
      </div>
    </>
  );
}
