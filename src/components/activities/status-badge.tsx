import { ACTIVITY_STATUS_LABEL, type ActivityStatus } from "@/lib/services/activity-status";
import { StatusBadge, type Tone } from "@/components/ui/misc";

const TONE: Record<ActivityStatus, Tone> = { UPCOMING: "blue", ONGOING: "green", ENDED: "gray", CANCELLED: "red" };

export const ActivityStatusBadge = ({ status }: { status: ActivityStatus }) => <StatusBadge tone={TONE[status]}>{ACTIVITY_STATUS_LABEL[status]}</StatusBadge>;
