import { usePostDownloadMultipleFlows } from "@/controllers/API/queries/flows";
import { useGetFolderQuery } from "@/controllers/API/queries/folders/use-get-folder";
import { useGetFoldersQuery } from "@/controllers/API/queries/folders/use-get-folders";
import useDeleteFlow from "@/hooks/flows/use-delete-flow";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useLocation, useParams } from "react-router-dom";
import CardsWrapComponent from "../../../../components/cardsWrapComponent";
import PaginatorComponent from "../../../../components/paginatorComponent";
import { SkeletonCardComponent } from "../../../../components/skeletonCardComponent";
import DeleteConfirmationModal from "../../../../modals/deleteConfirmationModal";
import useAlertStore from "../../../../stores/alertStore";
import useFlowsManagerStore from "../../../../stores/flowsManagerStore";
import { useFolderStore } from "../../../../stores/foldersStore";
import { FlowType } from "../../../../types/flow";
import useFileDrop from "../../hooks/use-on-file-drop";
import { getNameByType } from "../../utils/get-name-by-type";
import { sortFlows } from "../../utils/sort-flows";
import EmptyComponent from "../emptyComponent";
import HeaderComponent from "../headerComponent";
import CollectionCard from "./components/collectionCard";
import useDescriptionModal from "./hooks/use-description-modal";
import useFilteredFlows from "./hooks/use-filtered-flows";
import useDuplicateFlows from "./hooks/use-handle-duplicate";
import useSelectAll from "./hooks/use-handle-select-all";
import useSelectOptionsChange from "./hooks/use-select-options-change";
import useSelectedFlows from "./hooks/use-selected-flows";

export default function ComponentsComponent({
  type = "all",
}: {
  type?: string;
}) {
  const isLoading = useFlowsManagerStore((state) => state.isLoading);

  const { folderId } = useParams();

  const setSuccessData = useAlertStore((state) => state.setSuccessData);
  const setErrorData = useAlertStore((state) => state.setErrorData);
  const [openDelete, setOpenDelete] = useState(false);
  const searchFlowsComponents = useFlowsManagerStore(
    (state) => state.searchFlowsComponents,
  );

  const setSelectedFlowsComponentsCards = useFlowsManagerStore(
    (state) => state.setSelectedFlowsComponentsCards,
  );

  const selectedFlowsComponentsCards = useFlowsManagerStore(
    (state) => state.selectedFlowsComponentsCards,
  );
  const myCollectionId = useFolderStore((state) => state.myCollectionId);

  const { data: currentFolder, isLoading: isLoadingCurrentFolder } =
    useGetFolderQuery({
      id: folderId ?? myCollectionId ?? "",
    });
  const flowsFromFolder = currentFolder?.flows ?? [];

  const [filteredFlows, setFilteredFlows] =
    useState<FlowType[]>(flowsFromFolder);

  const handleFileDrop = useFileDrop(type);
  const [pageSize, setPageSize] = useState(20);
  const [pageIndex, setPageIndex] = useState(1);
  const all: FlowType[] = sortFlows(filteredFlows, type);
  const start = (pageIndex - 1) * pageSize;
  const end = start + pageSize;
  const data: FlowType[] = all?.slice(start, end);
  const location = useLocation();

  const name = getNameByType(type);

  const setSelectedFolder = useFolderStore((state) => state.setSelectedFolder);

  const { isLoading: isLoadingFolders } = useGetFoldersQuery();

  const [shouldSelectAll, setShouldSelectAll] = useState(true);

  const cardTypes = useMemo(() => {
    if (location.pathname.includes("components")) {
      return "Components";
    }
    if (location.pathname.includes("flows")) {
      return "Flows";
    }
    return "Items";
  }, [location]);

  useEffect(() => {
    setSelectedFlowsComponentsCards([]);
    handleSelectAll(false);
    setShouldSelectAll(true);
  }, [folderId, location, myCollectionId]);

  useFilteredFlows(flowsFromFolder, searchFlowsComponents, setFilteredFlows);

  const resetFilter = () => {
    setPageIndex(1);
    setPageSize(20);
  };

  const { getValues, control, setValue } = useForm();
  const entireFormValues = useWatch({ control });

  const methods = useForm();

  const { handleSelectAll } = useSelectAll(
    flowsFromFolder!,
    getValues,
    setValue,
  );

  const { handleDuplicate } = useDuplicateFlows(
    selectedFlowsComponentsCards,
    flowsFromFolder,
    resetFilter,
    setSuccessData,
    setSelectedFlowsComponentsCards,
    handleSelectAll,
    cardTypes,
  );

  const { mutate: mutateDownloadMultipleFlows } =
    usePostDownloadMultipleFlows();

  const handleExport = () => {
    mutateDownloadMultipleFlows(
      {
        flow_ids: selectedFlowsComponentsCards,
      },
      {
        onSuccess: (data) => {
          const selectedFlow = flowsFromFolder.find(
            (flow) => flow.id === selectedFlowsComponentsCards[0],
          );

          const blobType =
            selectedFlowsComponentsCards.length > 1
              ? "application/zip"
              : "application/json";

          const fileNameSuffix =
            selectedFlowsComponentsCards.length > 1
              ? "_langflow_flows.zip"
              : `${selectedFlow!.name}.json`;

          const blob = new Blob([data], { type: blobType });

          const link = document.createElement("a");
          link.href = window.URL.createObjectURL(blob);

          let current_time = new Date().toISOString().replace(/[:.]/g, "");

          current_time = current_time
            .replace(/-/g, "")
            .replace(/T/g, "")
            .replace(/Z/g, "");

          link.download =
            selectedFlowsComponentsCards.length > 1
              ? `${current_time}${fileNameSuffix}`
              : `${fileNameSuffix}`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setSuccessData({ title: `${cardTypes} exported successfully` });
          setSelectedFlowsComponentsCards([]);
          handleSelectAll(false);
          setShouldSelectAll(true);
        },
      },
    );
  };

  const { handleSelectOptionsChange } = useSelectOptionsChange(
    selectedFlowsComponentsCards,
    setErrorData,
    setOpenDelete,
    handleDuplicate,
    handleExport,
  );

  const deleteFlow = useDeleteFlow();

  const handleDeleteMultiple = () => {
    deleteFlow({ id: selectedFlowsComponentsCards })
      .then(() => {
        setSelectedFolder(null);
        resetFilter();
        setSelectedFlowsComponentsCards([]);
        handleSelectAll(false);
        setShouldSelectAll(true);
        setSuccessData({
          title: "Selected items deleted successfully",
        });
      })
      .catch(() => {
        setErrorData({
          title: "Error deleting items",
          list: ["Please try again"],
        });
      });
  };

  useSelectedFlows(entireFormValues, setSelectedFlowsComponentsCards);

  const descriptionModal = useDescriptionModal(
    selectedFlowsComponentsCards,
    type,
  );

  const totalRowsCount = filteredFlows?.length;

  return (
    <>
      <div className="flex w-full gap-4 pb-5">
        <HeaderComponent
          disabled={
            isLoading ||
            isLoadingFolders ||
            isLoadingCurrentFolder ||
            data?.length === 0
          }
          shouldSelectAll={shouldSelectAll}
          setShouldSelectAll={setShouldSelectAll}
          handleDelete={() => handleSelectOptionsChange("delete")}
          handleSelectAll={handleSelectAll}
          handleDuplicate={() => handleSelectOptionsChange("duplicate")}
          handleExport={() => handleSelectOptionsChange("export")}
          disableFunctions={!(selectedFlowsComponentsCards?.length > 0)}
        />
      </div>

      <CardsWrapComponent
        onFileDrop={handleFileDrop}
        dragMessage={`Drag your ${name} here`}
      >
        <div
          className="flex h-full w-full flex-col justify-between"
          data-testid="cards-wrapper"
        >
          <div className="flex w-full flex-col gap-4">
            {!isLoading &&
            !isLoadingFolders &&
            !isLoadingCurrentFolder &&
            data?.length === 0 ? (
              <EmptyComponent />
            ) : (
              <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-2">
                {data?.length > 0 &&
                isLoadingFolders === false &&
                isLoadingCurrentFolder === false ? (
                  <>
                    {data?.map((item) => (
                      <FormProvider {...methods} key={item.id}>
                        <form>
                          <CollectionCard
                            item={item}
                            type={type}
                            isLoading={isLoading}
                            control={control}
                          />
                        </form>
                      </FormProvider>
                    ))}
                  </>
                ) : (
                  <>
                    <SkeletonCardComponent />
                    <SkeletonCardComponent />
                  </>
                )}
              </div>
            )}
          </div>
          {!isLoading && data?.length > 0 && (
            <div className="relative py-6">
              <PaginatorComponent
                storeComponent={true}
                pageIndex={pageIndex}
                pageSize={pageSize}
                rowsCount={[10, 20, 50, 100]}
                totalRowsCount={totalRowsCount}
                paginate={(pageSize, pageIndex) => {
                  setPageIndex(pageIndex);
                  setPageSize(pageSize);
                }}
              ></PaginatorComponent>
            </div>
          )}
        </div>
      </CardsWrapComponent>
      {openDelete && (
        <DeleteConfirmationModal
          open={openDelete}
          setOpen={setOpenDelete}
          onConfirm={handleDeleteMultiple}
          description={descriptionModal}
        >
          <></>
        </DeleteConfirmationModal>
      )}
    </>
  );
}
