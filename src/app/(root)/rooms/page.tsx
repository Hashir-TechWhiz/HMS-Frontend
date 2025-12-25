import RoomsPage from "@/components/page-components/public/Rooms/RoomsPage";

export default function Rooms() {
    // User role will be determined by auth context later
    // For now, defaulting to "public"
    return <RoomsPage userRole="public" />;
}

