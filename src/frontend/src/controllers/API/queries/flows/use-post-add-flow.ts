import { useMutationFunctionType } from "@/types/api";
import { UseMutationResult } from "@tanstack/react-query";
import { ReactFlowJsonObject } from "reactflow";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";

interface IPostAddFlow {
  name: string;
  data: ReactFlowJsonObject;
  description: string;
  is_component: boolean;
  folder_id: string;
  endpoint_name: string | undefined;
}

export const usePostAddFlow: useMutationFunctionType<
  undefined,
  IPostAddFlow
> = (options?) => {
  const { mutate, queryClient } = UseRequestProcessor();

  const postAddFlowFn = async (payload: IPostAddFlow): Promise<any> => {
    const response = await api.post(`${getURL("FLOWS")}/`, {
      name: payload.name,
      data: payload.data,
      description: payload.description,
      is_component: payload.is_component,
      folder_id: payload.folder_id || null,
      endpoint_name: payload.endpoint_name || null,
    });

    return response.data;
  };

  const mutation: UseMutationResult<IPostAddFlow, any, IPostAddFlow> = mutate(
    ["usePostAddFlow"],
    postAddFlowFn,
    {
      ...options,
      onSettled: () => {
        queryClient.refetchQueries({ queryKey: ["useGetFolder"] });
      },
    },
  );

  return mutation;
};
