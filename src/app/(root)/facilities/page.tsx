import FacilitiesPage from "@/components/page-components/public/Facilities/FacilitiesPage";

export default function Facilities() {
    // User role will be determined by auth context later
    // For now, defaulting to "public"
    return <FacilitiesPage userRole="public" />;
}
