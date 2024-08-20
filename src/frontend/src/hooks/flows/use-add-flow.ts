import { usePostAddFlow } from "@/controllers/API/queries/flows/use-post-add-flow";
import useAlertStore from "@/stores/alertStore";
import useFlowsManagerStore from "@/stores/flowsManagerStore";
import { useFolderStore } from "@/stores/foldersStore";
import { useGlobalVariablesStore } from "@/stores/globalVariablesStore/globalVariables";
import { useTypesStore } from "@/stores/typesStore";
import { FlowType } from "@/types/flow";
import {
  addVersionToDuplicates,
  createNewFlow,
  extractFieldsFromComponenents,
  processDataFromFlow,
  processFlows,
  updateGroupRecursion,
} from "@/utils/reactflowUtils";
import { cloneDeep } from "lodash";
import { useParams } from "react-router-dom";
import useDeleteFlow from "./use-delete-flow";

const useAddFlow = () => {
  const unavaliableFields = useGlobalVariablesStore(
    (state) => state.unavailableFields,
  );
  const globalVariablesEntries = useGlobalVariablesStore(
    (state) => state.globalVariablesEntries,
  );
  const flows = useFlowsManagerStore((state) => state.flows);
  const setFlows = useFlowsManagerStore((state) => state.setFlows);
  const deleteFlow = useDeleteFlow();

  const { folderId } = useParams();

  const myCollectionId = useFolderStore((state) => state.myCollectionId);

  const { mutate: postAddFlow } = usePostAddFlow();

  const addFlow = async (params?: { flow?: FlowType; override?: boolean }) => {
    return new Promise(async (resolve, reject) => {
      const flow = cloneDeep(params?.flow) ?? undefined;
      let flowData = flow
        ? await processDataFromFlow(flow)
        : { nodes: [], edges: [], viewport: { zoom: 1, x: 0, y: 0 } };
      flowData?.nodes.forEach((node) => {
        updateGroupRecursion(
          node,
          flowData?.edges,
          unavaliableFields,
          globalVariablesEntries,
        );
      });
      // Create a new flow with a default name if no flow is provided.
      const folder_id = folderId ?? myCollectionId ?? "";

      if (params?.override && flow) {
        const flowId = flows?.find((f) => f.name === flow.name);
        if (flowId) {
          await deleteFlow({ id: flowId.id });
        }
      }
      const newFlow = createNewFlow(flowData!, folder_id, flow);

      const newName = addVersionToDuplicates(newFlow, flows ?? []);
      newFlow.name = newName;
      newFlow.folder_id = folder_id;

      postAddFlow(newFlow, {
        onSuccess: (createdFlow) => {
          // Add the new flow to the list of flows.
          const { data, flows: myFlows } = processFlows([
            createdFlow,
            ...(flows ?? []),
          ]);
          setFlows(myFlows);
          useTypesStore.setState((state) => ({
            data: { ...state.data, ["saved_components"]: data },
            ComponentFields: extractFieldsFromComponenents({
              ...state.data,
              ["saved_components"]: data,
            }),
          }));
          resolve(createdFlow.id);
        },
        onError: (error) => {
          if (error.response?.data?.detail) {
            useAlertStore.getState().setErrorData({
              title: "Could not load flows from database",
              list: [error.response?.data?.detail],
            });
          } else {
            useAlertStore.getState().setErrorData({
              title: "Could not load flows from database",
              list: [
                error.message ??
                  "An unexpected error occurred, please try again",
              ],
            });
          }
          reject(error); // Re-throw the error so the caller can handle it if needed},
        },
      });
    });
  };

  return addFlow;
};

export default useAddFlow;
