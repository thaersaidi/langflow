import ForwardedIconComponent from "@/components/genericIconComponent";
import { IS_MAC } from "@/constants/constants";
import { cn } from "@/utils/utils";

export default function RenderKey({
  value,
  tableRender,
}: {
  value: string;
  tableRender?: boolean;
}): JSX.Element {
  const check = value.toLowerCase().trim();
  return (
    <div>
      {check === "shift" ? (
        <ForwardedIconComponent
          name="ArrowBigUp"
          className={cn(tableRender ? "h-5 w-5" : "h-4 w-4")}
        />
      ) : check === "ctrl" && IS_MAC ? (
        <span>⌃</span>
      ) : check === "alt" && IS_MAC ? (
        <ForwardedIconComponent
          name="OptionIcon"
          className={cn(tableRender ? "h-4 w-4" : "h-3 w-3")}
        />
      ) : check === "cmd" ? (
        <ForwardedIconComponent
          name="Command"
          className={cn(tableRender ? "h-4 w-4" : "h-3 w-3")}
        />
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
}
